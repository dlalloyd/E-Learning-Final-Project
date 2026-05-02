'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, BookOpen, Star, ArrowRight, Volume2, VolumeX,
  Flame, Gem, MapPin, User as UserIcon, Trophy, Pause, TrendingUp, RotateCcw,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
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
import ConditionExplainer from '@/components/ConditionExplainer';
import PauseMenu from '@/components/PauseMenu';
import OnboardingModal from '@/components/OnboardingModal';
import Leaderboard from '@/components/Leaderboard';
import ShareCard from '@/components/ShareCard';
import { SessionErrorBoundary } from '@/components/SessionErrorBoundary';
import { useSfx } from '@/lib/hooks/useSfx';
import { xpProgress } from '@/lib/achievements';
import { shouldShowConditionExplainer, shouldShowSUS } from '@/lib/sessionFlow';

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
  1: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  2: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  3: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
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
    <div className="w-full space-y-2">
      <div className="flex justify-between text-[10px] font-bold tracking-widest text-slate-500 uppercase">
        <span>Novice</span>
        <span className="text-slate-400 normal-case tracking-normal font-mono">
          θ {theta.toFixed(3)} ± {sd.toFixed(3)}
        </span>
        <span>Expert</span>
      </div>
      <div className="h-2 w-full bg-[#131c2b] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out gm-theta-gradient"
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
  const prefersReducedMotion = useReducedMotion();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [condition, setCondition] = useState<'adaptive' | 'static'>('adaptive');
  const [showConditionExplainer, setShowConditionExplainer] = useState(false);

  // --- Auth State ---
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConsent, setAuthConsent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
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
        } else {
          setCondition(data.user.studyCondition ?? 'adaptive');
          try {
            const seen = localStorage.getItem('gm_condition_explainer_seen') === 'true';
            if (!seen) setShowConditionExplainer(true);
          } catch { /* localStorage unavailable */ }
        }
        // Fetch XP data for replayability UI
        fetch('/api/xp').then(r => r.json()).then(xp => {
          if (!xp.error) {
            setXpData({ totalXp: xp.totalXp, level: xp.level, currentStreak: xp.currentStreak, levelProgress: xp.levelProgress });
            if (xp.totalXp > 50) setProfileShake(true);
          }
        }).catch(() => {});
        // Fetch leaderboard opt-in status
        fetch('/api/user/leaderboard-consent').then(r => r.json()).then(d => {
          if (typeof d.leaderboardOptIn === 'boolean') setLeaderboardOptIn(d.leaderboardOptIn);
        }).catch(() => {});
        // Check for decayed KCs to show reminder on start screen
        fetch('/api/progress').then(r => r.json()).then(d => {
          if (d.kcProgress) {
            const decayed = d.kcProgress
              .filter((k: { needsReview: boolean; daysSinceLastPractice: number }) => k.needsReview && k.daysSinceLastPractice >= 1)
              .slice(0, 2)
              .map((k: { kcName: string; daysSinceLastPractice: number }) => ({ kcName: k.kcName, daysSince: Math.floor(k.daysSinceLastPractice) }));
            setDecayedKCs(decayed);
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

  // Detect password reset token in URL (?reset=TOKEN)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      setAuthView('reset');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Award XP on session completion — hoisted to top level (hooks cannot be called conditionally)
  useEffect(() => {
    if (appState !== 'complete') return;
    awardXP('session_complete');
    // Show SUS only after first completed session, and only if not already submitted
    fetch('/api/sus').then(r => r.json()).then(d => {
      if (d.totalResponses === 0) setShowSUS(true);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const [sessionId, setSessionId] = useState('');
  const [theta, setTheta] = useState(-0.780);
  const [thetaSd, setThetaSd] = useState(0.543);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [correctiveFeedback, setCorrectiveFeedback] = useState<string | null>(null);
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
  // Ref captures the trigger reason and question at the exact moment instruction is entered,
  // preventing stale-closure reads in handleInstructionComplete.
  const instructionEntryRef = useRef<{ trigger: InstructionTrigger; hasQuestion: boolean }>({
    trigger: 'low_mastery',
    hasQuestion: false,
  });

  // --- Replayability State ---
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [showPostSessionFlow, setShowPostSessionFlow] = useState(false);
  const [showElaboration, setShowElaboration] = useState(false);
  const [showSUS, setShowSUS] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileShake, setProfileShake] = useState(false);
  const [elaborationChance] = useState(0.2);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [decayedKCs, setDecayedKCs] = useState<Array<{ kcName: string; daysSince: number }>>([]); // 20% chance after correct answer
  const [xpData, setXpData] = useState<{ totalXp: number; level: number; currentStreak: number; levelProgress: number } | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean | null>(null); // null = unknown

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
      setCorrectiveFeedback(null);
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
        // Fetch corrective learning material for the failed KC
        setCorrectiveFeedback(null);
        if (currentKcId) {
          fetch(`/api/learning-objects/${currentKcId}`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => {
              const first = d?.learningObjects?.[0];
              if (first?.content) setCorrectiveFeedback(first.content);
            })
            .catch(() => null);
        }
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
    instructionEntryRef.current = { trigger: 'user_request', hasQuestion: !!question };
    setInstructionTrigger('user_request');
    setAppState('instruction');
  };

  // -- Handle instruction complete ----------------------------------------

  const handleInstructionComplete = () => {
    setConsecutiveFailures(0);
    const { trigger, hasQuestion } = instructionEntryRef.current;
    if (trigger === 'user_request' && hasQuestion) {
      // User clicked "Review Material" mid-question — return to the same question
      setStartTime(Date.now());
      setAppState('question');
    } else {
      // Auto-triggered after wrong answer — fetch next question
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
      instructionEntryRef.current = { trigger, hasQuestion: false };
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
        ? 'ring-2 ring-indigo-500 bg-indigo-500/10 text-white'
        : 'ring-1 ring-white/[0.06] bg-[#131c2b] hover:ring-indigo-500/40 hover:bg-indigo-500/5 cursor-pointer text-slate-200';
    }
    if (label === result?.correctAnswer) return 'ring-2 ring-emerald-500 bg-emerald-500/10 text-emerald-300';
    if (label === result?.selectedAnswer && !result.correct) return 'ring-2 ring-red-500 bg-red-500/10 text-red-300';
    return 'ring-1 ring-white/[0.04] bg-[#0d1527] text-slate-600';
  };

  const badgeStyle = (label: string) => {
    if (appState !== 'feedback') {
      return selected === label
        ? 'bg-indigo-500 text-white'
        : 'bg-[#222a3a] text-slate-500 group-hover:text-indigo-400';
    }
    if (label === result?.correctAnswer) return 'bg-emerald-500/20 text-emerald-400';
    if (label === result?.selectedAnswer && !result.correct) return 'bg-red-500/20 text-red-400';
    return 'bg-[#131c2b] text-slate-700';
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
      if (!authConsent) {
        setAuthError('You must agree to participate before creating an account');
        return;
      }
    }

    setAuthLoading(true);
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = authMode === 'signup'
        ? { email: authEmail, name: authName, password: authPassword, consentGiven: authConsent }
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
      // Show onboarding on first ever login
      try {
        if (!localStorage.getItem('gm_onboarding_seen')) setShowOnboarding(true);
      } catch { /* ignore */ }
      if (data.incompleteSession) {
        setResumableSessionId(data.incompleteSession.id);
        setCondition(data.incompleteSession.condition);
      } else {
        setCondition(data.user.studyCondition ?? 'adaptive');
        checkConditionExplainer();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotMsg('');
    setForgotLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotMsg('If that email is registered, a reset link is on its way.');
    } catch {
      setForgotMsg('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetMsg('');
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setResetMsg('Password updated. You can now log in.');
      setResetNewPassword('');
      setTimeout(() => setAuthView('login'), 2000);
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const handleExitSession = () => {
    // Session progress is persisted server-side — safe to exit at any time.
    // The incomplete session will be offered for resumption on next login.
    setShowPauseMenu(false);
    setAppState('start');
    setSessionId('');
    setQuestion(null);
    setSelected(null);
    setResult(null);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setConsecutiveFailures(0);
  };

  const handlePauseModeSwitch = (mode: 'adaptive' | 'static') => {
    setCondition(mode);
    setShowPauseMenu(false);
    // Mode change applies to current session going forward
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

  // --- Condition explainer gate ----------------------------------------

  const checkConditionExplainer = () => {
    try {
      const seen = localStorage.getItem('gm_condition_explainer_seen') === 'true';
      if (shouldShowConditionExplainer({ hasSeenExplainer: seen })) {
        setShowConditionExplainer(true);
      }
    } catch { /* localStorage unavailable */ }
  };

  const handleConditionAcknowledged = () => {
    setShowConditionExplainer(false);
  };

  // Assessment flow is removed - the adaptive session now handles
  // mixed difficulty and bloom levels directly. No separate pre/post tests.

  // --- Render: Start Screen -------------------------------------------

  if (appState === 'start') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-20 relative overflow-hidden">
        {/* Blur glow decorations */}
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        <FirstVisitTour />
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">
              GeoMentor
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Adaptive UK Geography Learning
            </p>
          </div>

          <div className="bg-[#0d1527]/90 ring-1 ring-white/[0.06] rounded-2xl p-8 space-y-6 backdrop-blur-sm relative">
            {/* Auth form when not logged in */}
            {!isLoggedIn ? (
              <>
                {authView === 'forgot' ? (
                  /* Forgot password form */
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-white font-bold text-base">Recover Credentials</p>
                      <p className="text-slate-400 text-xs">Enter your email and we&apos;ll send a reset link.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Email address</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                        placeholder="you@example.com"
                        className="w-full bg-[#131c2b] ring-1 ring-white/[0.06] focus:ring-2 focus:ring-indigo-500/40 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>
                    {forgotMsg && (
                      <p className="text-emerald-400 text-sm text-center">{forgotMsg}</p>
                    )}
                    <button
                      onClick={handleForgotPassword}
                      disabled={forgotLoading || !forgotEmail}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#131c2b] disabled:text-slate-600 text-white font-bold text-sm tracking-wide rounded-lg transition-all active:scale-[0.98]"
                    >
                      {forgotLoading ? 'Sending...' : 'Send Reset Link →'}
                    </button>
                    <button
                      onClick={() => { setAuthView('login'); setForgotMsg(''); }}
                      className="w-full text-slate-500 hover:text-slate-300 text-xs transition-colors py-1"
                    >
                      ← Back to login
                    </button>
                  </>
                ) : authView === 'reset' ? (
                  /* Reset password form */
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-white font-bold text-base">Set New Password</p>
                      <p className="text-slate-400 text-xs">Choose a new security key for your account.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">New password</label>
                      <input
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                        placeholder="Min. 8 characters"
                        className="w-full bg-[#131c2b] ring-1 ring-white/[0.06] focus:ring-2 focus:ring-indigo-500/40 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>
                    {resetMsg && (
                      <p className={`text-sm text-center ${resetMsg.includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>{resetMsg}</p>
                    )}
                    <button
                      onClick={handleResetPassword}
                      disabled={resetLoading || resetNewPassword.length < 8}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#131c2b] disabled:text-slate-600 text-white font-bold text-sm tracking-wide rounded-lg transition-all active:scale-[0.98]"
                    >
                      {resetLoading ? 'Updating...' : 'Update Password →'}
                    </button>
                    <button
                      onClick={() => setAuthView('login')}
                      className="w-full text-slate-500 hover:text-slate-300 text-xs transition-colors py-1"
                    >
                      ← Back to login
                    </button>
                  </>
                ) : (
                  /* Standard login / signup form */
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Your name</label>
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full bg-[#131c2b] ring-1 ring-white/[0.06] focus:ring-2 focus:ring-indigo-500/40 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Email address</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#131c2b] ring-1 ring-white/[0.06] focus:ring-2 focus:ring-indigo-500/40 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Password</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        placeholder="Min. 8 characters"
                        className="w-full bg-[#131c2b] ring-1 ring-white/[0.06] focus:ring-2 focus:ring-indigo-500/40 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>

                    {authMode === 'signup' && (
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={authConsent}
                          onChange={(e) => setAuthConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 accent-indigo-500 cursor-pointer shrink-0"
                        />
                        <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                          I agree to participate in this research study. My anonymised responses
                          will be used solely for academic purposes in accordance with the University
                          of Hull ethics policy. I can withdraw at any time.
                        </span>
                      </label>
                    )}

                    {authError && (
                      <p className="text-red-400 text-sm text-center">{authError}</p>
                    )}

                    <button
                      onClick={handleAuth}
                      disabled={authLoading || !authEmail || !authPassword || (authMode === 'signup' && (!authName || !authConsent))}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#131c2b] disabled:text-slate-600 text-white font-bold text-sm tracking-wide rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {authLoading ? 'Signing in...' : authMode === 'login' ? 'Sign in →' : 'Create account →'}
                    </button>
                    {authMode === 'login' && (
                      <div className="text-center">
                        <button
                          onClick={() => { setAuthView('forgot'); setForgotMsg(''); setForgotEmail(authEmail); }}
                          className="text-[11px] text-slate-600 hover:text-slate-400 cursor-pointer transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Logged in - show session options */
              <>
                <div className="text-center space-y-0.5">
                  <p className="text-white font-black text-lg tracking-tight">Welcome back, {userName}</p>
                  <p className="text-slate-400 text-xs">{authEmail || userId}</p>
                </div>

                {resumableSessionId && (
                  <button
                    onClick={handleResumeSession}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-all"
                  >
                    Resume Previous Session →
                  </button>
                )}

{/* Decay notification */}
                {decayedKCs.length > 0 && (
                  <div className="bg-amber-500/10 ring-1 ring-amber-500/20 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Knowledge fading — worth a refresh
                    </p>
                    {decayedKCs.map((k) => (
                      <p key={k.kcName} className="text-xs text-slate-400 pl-3">
                        {k.kcName} <span className="text-slate-600">· {k.daysSince}d since last practice</span>
                      </p>
                    ))}
                  </div>
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

                {showConditionExplainer ? (
                  <ConditionExplainer condition={condition} onAcknowledge={handleConditionAcknowledged} />
                ) : (
                  <div className="space-y-3">
                    {/* Active condition badge */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-slate-500 text-xs">Mode</span>
                      <button
                        onClick={() => setShowConditionExplainer(true)}
                        className="text-xs font-mono px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors"
                      >
                        {condition === 'adaptive' ? 'Adaptive (IRT+BKT)' : 'Static (fixed)'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const queue = [...FOUNDATION_KCS];
                        setLearnQueue(queue);
                        learnQueueRef.current = queue;
                        startSession();
                      }}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
                    >
                      Learn First, Then Quiz
                    </button>
                    <button
                      onClick={() => startSession()}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-sm"
                    >
                      Jump Into Questions
                    </button>
                    <p className="text-slate-600 text-xs text-center">
                      New? Choose &quot;Learn First&quot; for guided instruction. Ready to test? Jump straight in.
                    </p>
                  </div>
                )}

                {/* Mode status pill */}
                <div className="flex justify-center">
                  <div className="bg-[#060e1d] px-3 py-1.5 rounded-full ring-1 ring-white/[0.06] flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {condition === 'adaptive' ? 'Adaptive' : 'Static'} mode
                      </span>
                    </div>
                    <div className="h-2.5 w-px bg-white/10" />
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest">IRT · BKT</span>
                  </div>
                </div>

                {/* Leaderboard on start screen */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <Leaderboard />
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2 text-slate-600 hover:text-slate-400 text-xs transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-700 text-[10px] font-mono tracking-wider">
              University of Hull · BSc Software Engineering · 2026
            </p>
            <p className="text-slate-800 text-[9px] mt-0.5">
              Academic Portal · Dylan Bengi · Supervised by Peter Robinson
            </p>
          </div>
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Calibrating question...</p>
        </div>
      </main>
    );
  }

  // --- Render: Error --------------------------------------------------

  if (appState === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
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
      <main className="min-h-screen p-4 md:p-8">
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
      <main className="min-h-screen p-4 md:p-8">
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
    const thetaGain = theta - (-0.780);
    const handleNewSession = () => {
      setShowPostSessionFlow(false);
      setShowSUS(false);
      setAppState('start');
      setSessionId('');
      setTotalAnswered(0);
      setTotalCorrect(0);
      setConsecutiveFailures(0);
      // theta carries over server-side — don't reset it on client
    };

    const handlePostSessionDone = () => {
      setShowPostSessionFlow(false);
    };

    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pb-20 sm:p-6 sm:pb-20">
        <div className="w-full max-w-md space-y-4">
          {showSUS ? (
            <SUSQuestionnaire
              onComplete={() => {
                try { localStorage.setItem('gm_sus_completed', 'true'); } catch { /* ignore */ }
                setShowSUS(false);
              }}
              onSkip={() => setShowSUS(false)}
            />
          ) : (
            <>
              {/* Go again CTA */}
              <button
                onClick={handleNewSession}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all shadow-lg shadow-indigo-500/20"
              >
                <RotateCcw className="w-5 h-5" />
                Go again — build on your progress
              </button>

              <div className="bg-[#0d1527] ring-1 ring-white/[0.06] rounded-2xl p-6 sm:p-8">
                <SessionSummaryDashboard
                  sessionId={sessionId}
                  onNewSession={handleNewSession}
                  onStartReview={(kcId) => {
                    // Reset completion state, then immediately start a new session
                    // focused on the selected KC via the learn queue
                    setShowPostSessionFlow(false);
                    setShowSUS(false);
                    setSessionId('');
                    setTotalAnswered(0);
                    setTotalCorrect(0);
                    setConsecutiveFailures(0);
                    const queue = [kcId];
                    setLearnQueue(queue);
                    learnQueueRef.current = queue;
                    startSession();
                  }}
                />
              </div>
              <PostSessionFlow sessionId={sessionId} onDismiss={handlePostSessionDone} />

              {/* Theta gain + go again */}
              <div className="bg-[#0d1527] ring-1 ring-white/[0.06] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-widest">Ability gain this session</span>
                  </div>
                  <span className={`text-lg font-bold ${thetaGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {thetaGain >= 0 ? '+' : ''}{thetaGain.toFixed(3)} θ
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Start: -0.780</span>
                  <span>→</span>
                  <span className="text-slate-400">End: {theta.toFixed(3)}</span>
                </div>
              </div>

              {/* XP summary */}
              {xpData && (
                <div className="bg-[#0d1527] ring-1 ring-white/[0.06] rounded-xl p-4 flex items-center justify-between">
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

              <p className="text-slate-600 text-xs text-center">
                Your ability level carries over to the next session.
              </p>

              {/* Share result card */}
              <ShareCard
                thetaGain={thetaGain}
                accuracy={totalAnswered > 0 ? totalCorrect / totalAnswered : 0}
                sessionCount={1}
              />

              {/* Leaderboard consent banner (shown until user decides) */}
              {leaderboardOptIn === false && (
                <div className="bg-[#0d1527] ring-1 ring-amber-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">Join the leaderboard?</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Your first name + initial only. You can opt out any time. Only XP-ranked — no raw scores shown.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fetch('/api/user/leaderboard-consent', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ optIn: true }),
                        }).catch(() => {});
                        setLeaderboardOptIn(true);
                      }}
                      className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
                    >
                      Yes, show me
                    </button>
                    <button
                      onClick={() => {
                        fetch('/api/user/leaderboard-consent', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ optIn: false }),
                        }).catch(() => {});
                        setLeaderboardOptIn(null); // hide banner, don't ask again this session
                      }}
                      className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all ring-1 ring-white/[0.06]"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              <div className="bg-[#0d1527] ring-1 ring-white/[0.06] rounded-xl p-4">
                <Leaderboard />
              </div>
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
    <SessionErrorBoundary>
    <>
      {/* Fixed top nav — always visible during session */}
      <header className="fixed top-0 w-full z-50 bg-[#0b1323]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex justify-between items-center px-5 py-3 max-w-4xl mx-auto">
          <span className="text-sm font-black tracking-tighter text-white uppercase">GeoMentor</span>
          <div className="flex items-center gap-3">
            {/* Mode pill — clickable to open pause menu */}
            <button
              onClick={() => setShowPauseMenu(true)}
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ring-1 transition-all ${
                condition === 'adaptive'
                  ? 'bg-indigo-500/10 ring-indigo-500/30 text-indigo-300 hover:ring-indigo-500/60'
                  : 'bg-slate-800 ring-white/10 text-slate-400 hover:ring-white/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${condition === 'adaptive' ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`} />
              {condition}
            </button>
            <span className="text-xs text-slate-600 font-mono hidden sm:inline">{totalCorrect}/{question?.meta.questionsAnswered ?? 0}</span>
            <button
              onClick={toggleSfx}
              className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 transition-colors"
              aria-label={sfxMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            {/* Pause / exit */}
            <button
              onClick={() => setShowPauseMenu(true)}
              className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-md hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
              aria-label="Pause session"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Pause</span>
            </button>
          </div>
        </div>
        {/* Progress indicator underneath nav */}
        <div className="px-5 pt-1.5 pb-1 max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Question {(question?.meta.questionsAnswered ?? 0) + 1} of ~{questionsTotal || 15}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{progress}%</span>
        </div>
        <div className="h-[2px] w-full bg-[#131c2b]">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

    <main className="min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-2xl space-y-3">

        {/* Theta bar */}
        <div className="bg-[#0d1527] ring-1 ring-white/[0.06] rounded-xl p-4">
          <HelpTooltip text="Your ability estimate (theta) on a logit scale. It moves up when you answer correctly and down when you answer incorrectly.">
            <ThetaBar theta={theta} sd={thetaSd} />
          </HelpTooltip>
        </div>

        {/* Question card */}
        {question && (
          <div className="bg-[#0d1527] ring-1 ring-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl shadow-black/30">

            {/* Topic eyebrow + bloom badge + review button */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase block">
                  {question.kc.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${BLOOM_COLOURS[question.bloom]}`}>
                    {BLOOM_LABELS[question.bloom]}
                  </span>
                  <span className="text-xs text-slate-700 font-mono">
                    b={question.meta.itemDifficulty.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-600 font-mono hidden sm:inline">
                  {question.meta.questionsAnswered}/{questionsTotal}
                </span>
                {condition === 'adaptive' && appState === 'question' && (
                  <button
                    onClick={handleReviewRequest}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#131c2b] ring-1 ring-white/[0.06] text-slate-400 hover:text-slate-200 hover:ring-white/10 transition-all flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />Review
                  </button>
                )}
              </div>
            </div>

            {/* Question text — larger and heavier */}
            <h2 className="text-white text-xl sm:text-2xl font-bold leading-snug tracking-tight">
              {question.text}
            </h2>

            {/* Options — A/B/C/D badge chips */}
            <div className="space-y-2.5">
              {Object.entries(question.options).map(([label, text]) => (
                <motion.button
                  key={label}
                  whileHover={!prefersReducedMotion && appState === 'question' && !selected ? { scale: 1.01 } : {}}
                  whileTap={!prefersReducedMotion && appState === 'question' && !selected ? { scale: 0.99 } : {}}
                  transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => {
                    if (appState === 'question' && !selected) {
                      playSfx('click');
                      submitAnswer(label);
                    }
                  }}
                  disabled={appState === 'feedback' || !!selected}
                  className={`group w-full text-left p-4 sm:p-5 rounded-xl transition-all duration-200 flex items-center gap-4 ${optionStyle(label)}`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black shrink-0 transition-colors ${badgeStyle(label)}`}>
                    {label}
                  </span>
                  <span className="text-sm sm:text-base leading-snug font-medium">{text}</span>
                </motion.button>
              ))}
            </div>

            {/* Feedback */}
            {appState === 'feedback' && result && (
              <div className={`rounded-xl p-4 ring-1 ${result.correct ? 'bg-emerald-500/5 ring-emerald-500/20' : 'bg-red-500/5 ring-red-500/20'}`}>
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

                {!result.correct && correctiveFeedback && (
                  <div className="mt-3 p-3 bg-slate-800/60 ring-1 ring-white/[0.06] rounded-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />Key concept
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">{correctiveFeedback}</p>
                  </div>
                )}

                {willTriggerInstruction && (
                  <div className="mt-3 p-3 bg-indigo-500/5 ring-1 ring-indigo-500/20 rounded-lg">
                    <p className="text-indigo-400 text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 shrink-0" />Let&apos;s review this topic before continuing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Metadata cards — spatial context + cognitive load */}
            {appState === 'feedback' && (
              <div className="grid grid-cols-2 gap-2.5">
                {/* Spatial Context */}
                <div className="bg-[#131c2b] ring-1 ring-white/[0.04] rounded-lg p-3 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Topic</p>
                    <p className="text-xs text-slate-300 font-mono">{question?.kc?.replace(/_/g, ' ') ?? '—'}</p>
                  </div>
                </div>
                {/* Cognitive Load */}
                <div className="bg-[#131c2b] ring-1 ring-white/[0.04] rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Cognitive Load</p>
                  <div className="flex gap-1">
                    {([1, 2, 3, 4, 5] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setCognitiveLoad(level)}
                        className={`flex-1 h-6 rounded text-[10px] font-bold transition-all ${
                          cognitiveLoad === level
                            ? 'bg-violet-600 text-white'
                            : 'bg-[#0d1527] text-slate-600 hover:bg-[#131c2b] hover:text-slate-400'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-700 mt-1.5">
                    {cognitiveLoad ? `${cognitiveLoad === 1 ? 'Very easy' : cognitiveLoad === 2 ? 'Easy' : cognitiveLoad === 3 ? 'Moderate' : cognitiveLoad === 4 ? 'Hard' : 'Very hard'}` : 'Rate this question'}
                  </p>
                </div>
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
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 z-50"
          >
            <Gem className="w-4 h-4" />
            <span className="font-bold">+{xpToast.amount} XP</span>
          </motion.div>
        )}
      </div>
    </main>

    {/* Pause menu — available during question and feedback states */}
    <PauseMenu
      open={showPauseMenu}
      condition={condition}
      questionsAnswered={question?.meta.questionsAnswered ?? 0}
      questionsTotal={questionsTotal}
      theta={theta}
      onResume={() => setShowPauseMenu(false)}
      onExit={handleExitSession}
      onSwitchMode={handlePauseModeSwitch}
    />

    {/* First-time onboarding */}
    {showOnboarding && (
      <OnboardingModal onDone={() => setShowOnboarding(false)} />
    )}
    </>
    </SessionErrorBoundary>
  );
}



