'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, BookOpen, Star, ArrowRight, Volume2, VolumeX,
  Flame, Gem, MapPin, User as UserIcon, Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import InstructionMode from '@/components/InstructionMode';
import SessionSummaryDashboard from '@/components/SessionSummaryDashboard';
import HintPanel from '@/components/HintPanel';
import FirstVisitTour from '@/components/FirstVisitTour';
import HelpTooltip from '@/components/HelpTooltip';
import ProgressDashboard from '@/components/ProgressDashboard';
import PostSessionFlow from '@/components/PostSessionFlow';
import ElaborationPrompt from '@/components/ElaborationPrompt';
import SUSQuestionnaire from '@/components/SUSQuestionnaire';
import InteractiveMap from '@/components/InteractiveMap';
import LearnerProfile from '@/components/LearnerProfile';
import { useSfx } from '@/lib/hooks/useSfx';
import { xpProgress } from '@/lib/achievements';

// --- Types ------------------------------------------------------------

interface QuestionData {
  questionId: string;
  text: string;
  options: Record<string, string>;
  bloom: number;
  kc: string;
  meta: {
    currentTheta: number;
    itemDifficulty: number;
    itemInformation: number;
    questionsAnswered: number;
    questionsRemaining: number;
    isLastQuestion?: boolean;
    condition: string;
  };
}

interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  selectedAnswer: string;
  theta: {
    before: number;
    after: number;
    delta: number;
    sd: number;
    ci95: [number, number];
  };
  bkt: {
    kc: string;
    pLearned_before: number;
    pLearned_after: number;
    isMastered: boolean;
  };
}

type AppState = 'start' | 'loading' | 'question' | 'feedback' | 'instruction' | 'learn' | 'complete' | 'error';
type InstructionTrigger = 'low_mastery' | 'consecutive_failures' | 'user_request';

const BLOOM_LABELS: Record<number, string> = {
  1: 'Remembering',
  2: 'Understanding',
  3: 'Applying',
};

const BLOOM_COLOURS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-violet-100 text-violet-800',
  3: 'bg-amber-100 text-amber-800',
};

const STUDY_CONFIG = {
  quizId: 'quiz-uk-geo-adaptive',
};

// --- Instruction Mode Thresholds --------------------------------------
const MASTERY_THRESHOLD = 0.3;
const CONSECUTIVE_FAIL_THRESHOLD = 3;

// --- Theta Bar --------------------------------------------------------

function ThetaBar({ theta, sd }: { theta: number; sd: number }) {
  const pct = Math.round(((theta + 3) / 6) * 100);
  const clamped = Math.max(2, Math.min(98, pct));

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Novice</span>
        <span className="font-mono text-slate-700">
          θ = {theta.toFixed(3)} ± {sd.toFixed(3)}
        </span>
        <span>Expert</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// --- Main Component ---------------------------------------------------

export default function QuizPage() {
  const { play: playSfx, muted: sfxMuted, toggleMute: toggleSfx } = useSfx();
  const [appState, setAppState] = useState<AppState>('start');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [condition, setCondition] = useState<'adaptive' | 'static'>('adaptive');

  // --- Auth State ---
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [resumableSessionId, setResumableSessionId] = useState<string | null>(null);

  // Auto-login check on mount
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) {
        setUserId(data.user.id);
        setUserName(data.user.name);
        setIsLoggedIn(true);
        if (data.incompleteSession) {
          setResumableSessionId(data.incompleteSession.id);
          setCondition(data.incompleteSession.condition);
        }
        // Fetch XP data for replayability UI
        fetch('/api/xp').then(r => r.json()).then(xp => {
          if (!xp.error) {
            setXpData({ totalXp: xp.totalXp, level: xp.level, currentStreak: xp.currentStreak, levelProgress: xp.levelProgress });
            // Shake the profile icon to catch attention after 2 sessions
            if (xp.totalXp > 50) setProfileShake(true);
          }
        }).catch(() => {});
        // Award daily login XP
        fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'daily_login' }),
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // Award XP on session completion — hoisted to top level (hooks cannot be called conditionally)
  useEffect(() => {
    if (appState !== 'complete') return;
    awardXP('session_complete');
    fetch('/api/progress').then(r => r.json()).then(d => {
      if (d.stats?.totalSessions === 1) setShowSUS(true);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const [sessionId, setSessionId] = useState('');
  const [theta, setTheta] = useState(-0.780);
  const [thetaSd, setThetaSd] = useState(0.543);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Cognitive Load State ---
  const [cognitiveLoad, setCognitiveLoad] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  // --- Hint State (per question, reset on each new question) ---
  const [hintsUsedThisQ, setHintsUsedThisQ] = useState(0);
  const [hintLevelMaxThisQ, setHintLevelMaxThisQ] = useState(0);

  // --- Instruction Mode State ---
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [currentKcId, setCurrentKcId] = useState<string>('');
  const [instructionTrigger, setInstructionTrigger] = useState<InstructionTrigger>('low_mastery');

  // --- Replayability State ---
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [showPostSessionFlow, setShowPostSessionFlow] = useState(false);
  const [showElaboration, setShowElaboration] = useState(false);
  const [showSUS, setShowSUS] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileShake, setProfileShake] = useState(false);
  const [elaborationChance] = useState(0.2); // 20% chance after correct answer
  const [xpData, setXpData] = useState<{ totalXp: number; level: number; currentStreak: number; levelProgress: number } | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);

  // --- Learning-First Onboarding ---
  const FOUNDATION_KCS = [
    'UK_capitals', 'UK_county_locations', 'UK_rivers',
    'UK_mountains', 'UK_national_parks',
  ];
  const [learnQueue, setLearnQueue] = useState<string[]>([]);
  const learnQueueRef = useRef<string[]>([]);

  // -- Fetch next question ----------------------------------------------

  const fetchNextQuestion = useCallback(async (sid: string) => {
    // Check ref (not state) to avoid stale closure
    if (learnQueueRef.current.length > 0) {
      const nextKc = learnQueueRef.current[0];
      setCurrentKcId(nextKc);
      setInstructionTrigger('low_mastery');
      setAppState('learn');
      return;
    }

    setAppState('loading');
    try {
      const res = await fetch(`/api/sessions/${sid}/next-question`);
      const data = await res.json();

      if (data.completed) {
        playSfx('complete');
        setAppState('complete');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Failed to load question');

      setQuestion(data);
      setCurrentKcId(data.kc);
      setSelected(null);
      setResult(null);
      setCognitiveLoad(null);
      setHintsUsedThisQ(0);
      setHintLevelMaxThisQ(0);
      setStartTime(Date.now());
      setAppState('question');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  }, []);

  // -- Start session ----------------------------------------------------

  const startSession = async (seedFromAssessmentId?: string) => {
    if (!userId.trim()) return;
    setAppState('loading');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          quizId: STUDY_CONFIG.quizId,
          condition,
          ...(seedFromAssessmentId ? { seedFromAssessmentId } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');

      setSessionId(data.sessionId);
      setTheta(data.theta);
      setThetaSd(data.thetaSd);
      setConsecutiveFailures(0);
      await fetchNextQuestion(data.sessionId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  };

  // -- Check if instruction mode should trigger --------------------------

  const shouldTriggerInstruction = (answerResult: AnswerResult, failures: number): InstructionTrigger | null => {
    if (condition !== 'adaptive') return null;
    if (answerResult.correct) return null;

    if (failures >= CONSECUTIVE_FAIL_THRESHOLD) {
      return 'consecutive_failures';
    }

    if (answerResult.bkt.pLearned_after < MASTERY_THRESHOLD) {
      return 'low_mastery';
    }

    return null;
  };

  // -- Award XP helper ---------------------------------------------------
  const awardXP = async (reason: string) => {
    try {
      const res = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, sessionId }),
      });
      const data = await res.json();
      if (data.awarded) {
        setXpToast({ amount: data.awarded + (data.streakBonus || 0), reason });
        setXpData({ totalXp: data.totalXp, level: data.level, currentStreak: data.streak, levelProgress: data.levelProgress });
        setTimeout(() => setXpToast(null), 2000);
      }
    } catch { /* ignore XP errors */ }
  };

  // -- Submit answer ----------------------------------------------------

  const submitAnswer = async (answer: string) => {
    if (!question || !sessionId) return;
    setSelected(answer);

    const responseTimeMs = Date.now() - startTime;
    // Implicit confidence from response time (Klauer et al., 2007):
    // Fast + correct → high confidence, Slow → low confidence
    const confidenceLevel = responseTimeMs < 10000 ? 3 : responseTimeMs < 20000 ? 2 : 1;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.questionId,
          selectedAnswer: answer,
          responseTimeMs,
          confidenceLevel,
          cognitiveLoad: cognitiveLoad ?? undefined,
          hintsUsed: hintsUsedThisQ,
          hintLevelMax: hintLevelMaxThisQ,
          optionsMap: question.options,
        }),
      });

      const data: AnswerResult = await res.json();
      if (!res.ok) throw new Error((data as any).error || 'Failed to submit answer');

      setResult(data);
      setTheta(data.theta.after);
      setThetaSd(data.theta.sd);
      setTotalAnswered((n) => n + 1);

      // Sound feedback
      if (data.correct) {
        playSfx(data.bkt.isMastered ? 'levelup' : 'correct');
      } else {
        playSfx('incorrect');
      }

      let newFailures = consecutiveFailures;
      if (data.correct) {
        setTotalCorrect((n) => n + 1);
        setConsecutiveFailures(0);
        newFailures = 0;
        // Award XP based on bloom level and hint usage
        const bloom = question?.bloom || 1;
        if (bloom >= 3) awardXP('correct_bloom_3');
        else if (bloom >= 2) awardXP('correct_bloom_2');
        else if (hintsUsedThisQ === 0) awardXP('correct_no_hints');
        else awardXP('correct_answer');
        // Check mastery achievement
        if (data.bkt.isMastered) awardXP('mastery_achieved');
      } else {
        newFailures = consecutiveFailures + 1;
        setConsecutiveFailures(newFailures);
      }

      const trigger = shouldTriggerInstruction(data, newFailures);
      if (trigger) {
        setInstructionTrigger(trigger);
      }

      setAppState('feedback');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  };

  // -- Handle "Review Material" button click ------------------------------

  const handleReviewRequest = () => {
    setInstructionTrigger('user_request');
    setAppState('instruction');
  };

  // -- Handle instruction complete ----------------------------------------

  const handleInstructionComplete = () => {
    setConsecutiveFailures(0);
    if (instructionTrigger === 'user_request' && question) {
      // User clicked "Review Material" mid-question - return to the same question
      setStartTime(Date.now());
      setAppState('question');
    } else {
      // Auto-triggered after wrong answer - fetch next question
      fetchNextQuestion(sessionId);
    }
  };

  // -- Handle next after feedback -----------------------------------------

  const handleNextAfterFeedback = () => {
    // Check if elaboration prompt should show (20% chance after correct, unassisted)
    if (result?.correct && hintsUsedThisQ === 0 && Math.random() < elaborationChance) {
      setShowElaboration(true);
      return;
    }
    proceedAfterFeedback();
  };

  const proceedAfterFeedback = () => {
    setShowElaboration(false);
    const trigger = shouldTriggerInstruction(result!, consecutiveFailures);
    if (trigger) {
      setInstructionTrigger(trigger);
      setAppState('instruction');
    } else {
      fetchNextQuestion(sessionId);
    }
  };

  // -- Option button style ----------------------------------------------

  const optionStyle = (label: string) => {
    if (appState !== 'feedback') {
      return selected === label
        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer';
    }
    if (label === result?.correctAnswer) return 'border-emerald-500 bg-emerald-50 text-emerald-900';
    if (label === result?.selectedAnswer && !result.correct) return 'border-red-400 bg-red-50 text-red-900';
    return 'border-slate-200 bg-white text-slate-400';
  };

  // --- Auth handlers ----------------------------------------------------

  const handleAuth = async () => {
    setAuthError('');

    // Client-side validation for signup
    if (authMode === 'signup') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(authEmail)) {
        setAuthError('Please enter a valid email address');
        return;
      }
      if (authPassword.length < 8) {
        setAuthError('Password must be at least 8 characters');
        return;
      }
      if (!/[a-zA-Z]/.test(authPassword) || !/\d/.test(authPassword)) {
        setAuthError('Password must contain at least one letter and one number');
        return;
      }
    }

    setAuthLoading(true);
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = authMode === 'signup'
        ? { email: authEmail, name: authName, password: authPassword }
        : { email: authEmail, password: authPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setUserId(data.user.id);
      setUserName(data.user.name);
      setIsLoggedIn(true);
      if (data.incompleteSession) {
        setResumableSessionId(data.incompleteSession.id);
        setCondition(data.incompleteSession.condition);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUserId('');
    setUserName('');
    setSessionId('');
    setResumableSessionId(null);
    setAppState('start');
  };

  const handleResumeSession = async () => {
    if (!resumableSessionId) return;
    setSessionId(resumableSessionId);
    setResumableSessionId(null);
    fetchNextQuestion(resumableSessionId);
  };

  // Assessment flow is removed - the adaptive session now handles
  // mixed difficulty and bloom levels directly. No separate pre/post tests.

  // --- Render: Start Screen -------------------------------------------

  if (appState === 'start') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-20">
        <FirstVisitTour />
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono tracking-widest uppercase">
              Intelligent Tutoring System
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              GeoMentor
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Adaptive UK Geography Learning
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            {/* Auth form when not logged in */}
            {!isLoggedIn ? (
              <>
                <div className="flex rounded-lg bg-slate-800 p-1">
                  {(['login', 'signup'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setAuthMode(m); setAuthError(''); }}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                        authMode === m
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {m === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {authError && (
                  <p className="text-red-400 text-sm text-center">{authError}</p>
                )}

                <button
                  onClick={handleAuth}
                  disabled={authLoading || !authEmail || !authPassword || (authMode === 'signup' && !authName)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
                >
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Create Account'}
                </button>
              </>
            ) : (
              /* Logged in - show session options */
              <>
                <div className="text-center">
                  <p className="text-white font-medium">Welcome back, {userName}</p>
                  <p className="text-slate-500 text-xs mt-1">{authEmail || userId}</p>
                </div>

                {resumableSessionId && (
                  <button
                    onClick={handleResumeSession}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-all"
                  >
                    Resume Previous Session →
                  </button>
                )}

{/* XP / Streak / Level bar */}
                {xpData && (
                  <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gem className="w-4 h-4 text-indigo-400" />
                        <span className="text-white text-sm font-bold">Level {xpData.level}</span>
                        <span className="text-slate-500 text-xs">{xpData.totalXp} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className={`w-4 h-4 ${xpData.currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
                        <span className={`text-sm font-bold ${xpData.currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                          {xpData.currentStreak}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${(xpData.levelProgress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const queue = [...FOUNDATION_KCS];
                      setLearnQueue(queue);
                      learnQueueRef.current = queue;
                      startSession();
                    }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all"
                  >
                    Learn First, Then Quiz
                  </button>
                  <button
                    onClick={() => startSession()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all text-sm"
                  >
                    Jump Into Questions
                  </button>
                  <p className="text-slate-600 text-xs text-center">
                    New? Choose &quot;Learn First&quot; for guided instruction. Ready to test? Jump straight in.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors"
                >
                  Log Out
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-slate-600 text-xs">
            University of Hull · CS Final Year Project · Dylan Bengi
          </p>
        </div>

        {/* --- Persistent bottom nav (logged-in only) --- */}
        {isLoggedIn && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800">
            <div className="max-w-md mx-auto flex items-center justify-around px-4 py-2">
              <button
                onClick={() => setShowMap(true)}
                className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all"
              >
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-medium">Map</span>
              </button>
              <button
                onClick={() => setShowProgressDashboard(true)}
                className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all"
              >
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-medium">Progress</span>
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition-all ${profileShake ? 'animate-bounce' : ''}`}
              >
                <UserIcon className="w-5 h-5 text-violet-400" />
                <span className="text-[10px] font-medium">Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* --- Modal overlays --- */}
        {showProgressDashboard && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4">
            <div className="max-w-lg mx-auto mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-bold text-lg">Progress</h2>
                <button onClick={() => setShowProgressDashboard(false)} className="text-slate-500 hover:text-white transition-colors text-sm">Close</button>
              </div>
              <ProgressDashboard
                onStartSession={() => { setShowProgressDashboard(false); startSession(); }}
                onStartReview={(kcId) => {
                  setShowProgressDashboard(false);
                  const queue = [kcId];
                  setLearnQueue(queue);
                  learnQueueRef.current = queue;
                  startSession();
                }}
              />
            </div>
          </div>
        )}
        {showMap && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto mt-4">
              <InteractiveMap
                onClose={() => setShowMap(false)}
                onFactUnlocked={() => awardXP('map_fact_unlocked')}
              />
            </div>
          </div>
        )}
        {showProfile && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4">
            <div className="max-w-lg mx-auto mt-4">
              <LearnerProfile onClose={() => { setShowProfile(false); setProfileShake(false); }} />
            </div>
          </div>
        )}
      </main>
    );
  }

  // --- Render: Loading ------------------------------------------------

  if (appState === 'loading') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-mono">Loading question...</p>
        </div>
      </main>
    );
  }

  // --- Render: Error --------------------------------------------------

  if (appState === 'error') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-white font-bold text-xl">Something went wrong</h2>
          <p className="text-red-400 text-sm font-mono">{errorMsg}</p>
          <button
            onClick={() => setAppState('start')}
            className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Return to start
          </button>
        </div>
      </main>
    );
  }

  // --- Render: Learning-First Onboarding ------------------------------

  if (appState === 'learn') {
    const handleLearnComplete = () => {
      const remaining = learnQueueRef.current.slice(1);
      setLearnQueue(remaining);
      learnQueueRef.current = remaining;
      if (remaining.length > 0) {
        setCurrentKcId(remaining[0]);
      } else {
        fetchNextQuestion(sessionId);
      }
    };

    return (
      <main className="min-h-screen bg-slate-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Learning Mode · Topic {FOUNDATION_KCS.length - learnQueue.length + 1}/{FOUNDATION_KCS.length}</span>
            <button
              onClick={() => { setLearnQueue([]); learnQueueRef.current = []; fetchNextQuestion(sessionId); }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip to Quiz →
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {FOUNDATION_KCS.map((kc, i) => (
              <div
                key={kc}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < FOUNDATION_KCS.length - learnQueue.length
                    ? 'bg-emerald-500'
                    : i === FOUNDATION_KCS.length - learnQueue.length
                    ? 'bg-indigo-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <InstructionMode
            kcId={currentKcId}
            sessionId={sessionId}
            onComplete={handleLearnComplete}
            triggerReason="low_mastery"
          />
        </div>
      </main>
    );
  }

  // --- Render: Instruction Mode (mid-quiz remediation) ----------------

  if (appState === 'instruction') {
    return (
      <main className="min-h-screen bg-slate-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{condition} · Session: {sessionId.slice(0, 8)}...</span>
            <span>{totalCorrect}/{totalAnswered} correct</span>
          </div>

          <InstructionMode
            kcId={currentKcId}
            sessionId={sessionId}
            onComplete={handleInstructionComplete}
            triggerReason={instructionTrigger}
          />
        </div>
      </main>
    );
  }

  // --- Render: Complete -----------------------------------------------

  if (appState === 'complete') {
    const handleNewSession = () => {
      setShowPostSessionFlow(false);
      setShowSUS(false);
      setAppState('start');
      setSessionId('');
      setTotalAnswered(0);
      setTotalCorrect(0);
      setTheta(-0.780);
      setThetaSd(0.543);
      setConsecutiveFailures(0);
    };

    const handlePostSessionDone = () => {
      setShowPostSessionFlow(false);
    };

    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pb-20 sm:p-6 sm:pb-20">
        <div className="w-full max-w-md space-y-4">
          {showSUS ? (
            <SUSQuestionnaire onComplete={() => setShowSUS(false)} onSkip={() => setShowSUS(false)} />
          ) : (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <SessionSummaryDashboard sessionId={sessionId} onNewSession={handleNewSession} />
              </div>
              <PostSessionFlow sessionId={sessionId} onDismiss={handlePostSessionDone} />

              {/* XP summary */}
              {xpData && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-indigo-400" />
                    <span className="text-white font-bold">Level {xpData.level}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 text-sm">{xpData.totalXp} XP</span>
                    {xpData.currentStreak > 0 && (
                      <span className="flex items-center gap-1 text-orange-400 text-sm">
                        <Flame className="w-4 h-4" />{xpData.currentStreak} day streak
                      </span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-slate-500 text-xs text-center">
                Come back tomorrow to keep your streak going.
              </p>
            </>
          )}
        </div>

        {/* Persistent bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800">
          <div className="max-w-md mx-auto flex items-center justify-around px-4 py-2">
            <button
              onClick={() => setShowMap(true)}
              className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all"
            >
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-medium">Map</span>
            </button>
            <button
              onClick={() => setShowProgressDashboard(true)}
              className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-medium">Progress</span>
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition-all"
            >
              <UserIcon className="w-5 h-5 text-violet-400" />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </div>

        {/* Modal overlays */}
        {showProgressDashboard && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4">
            <div className="max-w-lg mx-auto mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-bold text-lg">Progress</h2>
                <button onClick={() => setShowProgressDashboard(false)} className="text-slate-500 hover:text-white transition-colors text-sm">Close</button>
              </div>
              <ProgressDashboard
                onStartSession={() => { setShowProgressDashboard(false); startSession(); }}
                onStartReview={(kcId) => {
                  setShowProgressDashboard(false);
                  const queue = [kcId];
                  setLearnQueue(queue);
                  learnQueueRef.current = queue;
                  startSession();
                }}
              />
            </div>
          </div>
        )}
        {showMap && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto mt-4">
              <InteractiveMap
                onClose={() => setShowMap(false)}
                onFactUnlocked={() => awardXP('map_fact_unlocked')}
              />
            </div>
          </div>
        )}
        {showProfile && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4">
            <div className="max-w-lg mx-auto mt-4">
              <LearnerProfile onClose={() => { setShowProfile(false); }} />
            </div>
          </div>
        )}
      </main>
    );
  }

  // Assessment render section removed - adaptive session handles all question types

  // --- Render: Question / Feedback -------------------------------------

  const questionsTotal = question
    ? question.meta.questionsAnswered + question.meta.questionsRemaining
    : 0;
  const progress = question
    ? Math.round((question.meta.questionsAnswered / questionsTotal) * 100)
    : 0;

  const willTriggerInstruction = result && !result.correct && shouldTriggerInstruction(result, consecutiveFailures);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
          <span>{condition} · {question?.meta.questionsAnswered ?? 0}/{questionsTotal} questions</span>
          <div className="flex items-center gap-3">
            <span>{totalCorrect} correct</span>
            <button
              onClick={toggleSfx}
              className="p-1 rounded hover:bg-slate-800 transition-colors"
              title={sfxMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-slate-800 rounded-full">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Theta bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <HelpTooltip text="Your ability estimate (theta) on a logit scale. It moves up when you answer correctly and down when you answer incorrectly. The shaded area shows confidence.">
            <ThetaBar theta={theta} sd={thetaSd} />
          </HelpTooltip>
        </div>

        {/* Question card */}
        {question && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">

            {/* Bloom badge + Review button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${BLOOM_COLOURS[question.bloom]}`}>
                  {BLOOM_LABELS[question.bloom]}
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  b = {question.meta.itemDifficulty.toFixed(2)}
                </span>
              </div>

              {condition === 'adaptive' && appState === 'question' && (
                <button
                  onClick={handleReviewRequest}
                  className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 inline mr-1" />Review Material
                </button>
              )}
            </div>

            {/* Question text */}
            <h2 className="text-white text-lg font-medium leading-relaxed">
              {question.text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {Object.entries(question.options).map(([label, text]) => (
                <motion.button
                  key={label}
                  whileHover={appState === 'question' && !selected ? { scale: 1.02 } : {}}
                  whileTap={appState === 'question' && !selected ? { scale: 0.98 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => {
                    if (appState === 'question' && !selected) {
                      playSfx('click');
                      submitAnswer(label);
                    }
                  }}
                  disabled={appState === 'feedback' || !!selected}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${optionStyle(label)}`}
                >
                  <span className="font-mono font-bold text-sm mr-3 opacity-60">{label}</span>
                  <span className="text-sm">{text}</span>
                </motion.button>
              ))}
            </div>

            {/* Feedback */}
            {appState === 'feedback' && result && (
              <div className={`rounded-xl p-4 border ${result.correct ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  <span className={`font-semibold text-sm ${result.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.correct ? 'Correct!' : `Incorrect, answer was ${result.correctAnswer}`}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 space-y-1">
                  <div>
                    θ: {result.theta.before.toFixed(3)} → {result.theta.after.toFixed(3)}
                    <span className={`ml-2 ${result.theta.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      ({result.theta.delta >= 0 ? '+' : ''}{result.theta.delta.toFixed(3)})
                    </span>
                  </div>
                  <div>
                    P(Learned) [{result.bkt.kc}]: {result.bkt.pLearned_before.toFixed(3)} → {result.bkt.pLearned_after.toFixed(3)}
                    {result.bkt.isMastered && <span className="ml-2 text-amber-400 flex items-center gap-1 inline-flex"><Star className="w-3 h-3" /> Mastered</span>}
                  </div>
                  {consecutiveFailures > 0 && !result.correct && (
                    <div className="text-amber-500">
                      Consecutive incorrect: {consecutiveFailures}
                    </div>
                  )}
                </div>

                {willTriggerInstruction && (
                  <div className="mt-3 p-3 bg-blue-950/50 border border-blue-800 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      <BookOpen className="w-4 h-4 inline mr-1" />Let's review this topic before continuing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cognitive Load Rating - compact inline */}
            {appState === 'feedback' && (
              <div className="flex items-center gap-3 px-1">
                <span className="text-slate-500 text-xs whitespace-nowrap">Difficulty:</span>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setCognitiveLoad(level)}
                      className={`w-8 h-8 rounded-md text-xs font-semibold transition-all ${
                        cognitiveLoad === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="text-slate-600 text-xs">
                  {cognitiveLoad === 1 ? 'Easy' : cognitiveLoad === 5 ? 'Hard' : ''}
                </span>
              </div>
            )}

            {/* Hints (available during question, before answering) */}
            {appState === 'question' && question && !selected && (
              <HintPanel
                questionId={question.questionId}
                sessionId={sessionId}
                show={true}
                onHintRevealed={(level) => {
                  setHintsUsedThisQ((prev) => prev + 1);
                  setHintLevelMaxThisQ((prev) => Math.max(prev, level));
                }}
              />
            )}

            {/* Elaboration prompt (Feature 6 - 20% chance after correct) */}
            {showElaboration && question && (
              <ElaborationPrompt
                sessionId={sessionId}
                questionId={question.questionId}
                kcId={currentKcId}
                bloomLevel={question.bloom || 1}
                onComplete={proceedAfterFeedback}
                onSkip={proceedAfterFeedback}
              />
            )}

            {/* Next / Finish button */}
            {appState === 'feedback' && !showElaboration && (
              <button
                onClick={handleNextAfterFeedback}
                className={`w-full py-4 font-semibold rounded-xl transition-all ${
                  willTriggerInstruction
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : question?.meta?.isLastQuestion
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {willTriggerInstruction
                  ? <><BookOpen className="w-4 h-4 inline mr-1" />Review Material <ArrowRight className="w-4 h-4 inline ml-1" /></>
                  : question?.meta?.isLastQuestion
                  ? <>Finish Quiz <CheckCircle2 className="w-4 h-4 inline ml-1" /></>
                  : <>Next Question <ArrowRight className="w-4 h-4 inline ml-1" /></>}
              </button>
            )}
          </div>
        )}

        {/* XP Toast */}
        {xpToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 z-50"
          >
            <Gem className="w-4 h-4" />
            <span className="font-bold">+{xpToast.amount} XP</span>
          </motion.div>
        )}
      </div>
    </main>
  );
}



