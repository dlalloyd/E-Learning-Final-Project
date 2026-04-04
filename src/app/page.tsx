'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import InstructionMode from '@/components/InstructionMode';
import SessionSummaryDashboard from '@/components/SessionSummaryDashboard';
import HintPanel from '@/components/HintPanel';

// ——— Types ————————————————————————————————————————————————————————————

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

type AppState = 'start' | 'loading' | 'question' | 'feedback' | 'instruction' | 'learn' | 'complete' | 'error' | 'assessment';
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

// ——— Instruction Mode Thresholds ——————————————————————————————————————
const MASTERY_THRESHOLD = 0.3;
const CONSECUTIVE_FAIL_THRESHOLD = 3;

// ——— Theta Bar ————————————————————————————————————————————————————————

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

// ——— Main Component ———————————————————————————————————————————————————

export default function QuizPage() {
  const [appState, setAppState] = useState<AppState>('start');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [condition, setCondition] = useState<'adaptive' | 'static'>('adaptive');

  // ——— Auth State ———
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
        // Check for delayed test availability
        fetch(`/api/assessments?userId=${data.user.id}`).then(r => r.json()).then(aData => {
          if (aData.delayedTestAvailability) {
            const available = aData.delayedTestAvailability.find(
              (d: { delayedTestAvailable: boolean; delayedTestCompleted: boolean }) =>
                d.delayedTestAvailable && !d.delayedTestCompleted
            );
            if (available) {
              setDelayedTestAvailable({ sessionId: available.sessionId });
            }
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);
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

  // ——— Cognitive Load State ———
  const [cognitiveLoad, setCognitiveLoad] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  // ——— Instruction Mode State ———
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [currentKcId, setCurrentKcId] = useState<string>('');
  const [instructionTrigger, setInstructionTrigger] = useState<InstructionTrigger>('low_mastery');

  // ——— Assessment State (Pre/Post/Delayed Tests) ———
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<'pre_test' | 'post_test' | 'delayed_post_test'>('pre_test');
  const [assessmentQuestion, setAssessmentQuestion] = useState<QuestionData | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<{ correct: boolean; correctAnswer: string; selectedAnswer: string } | null>(null);
  const [assessmentSelected, setAssessmentSelected] = useState<string | null>(null);
  const [assessmentScore, setAssessmentScore] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);
  const [delayedTestAvailable, setDelayedTestAvailable] = useState<{ sessionId: string; daysRemaining?: number } | null>(null);

  // ——— Learning-First Onboarding ———
  const FOUNDATION_KCS = [
    'UK_capitals', 'UK_county_locations', 'UK_rivers',
    'UK_mountains', 'UK_national_parks',
  ];
  const [learnQueue, setLearnQueue] = useState<string[]>([]);
  const learnQueueRef = useRef<string[]>([]);

  // —— Fetch next question ——————————————————————————————————————————————

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
        setAppState('complete');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Failed to load question');

      setQuestion(data);
      setCurrentKcId(data.kc);
      setSelected(null);
      setResult(null);
      setCognitiveLoad(null);
      setStartTime(Date.now());
      setAppState('question');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  }, []);

  // —— Start session ————————————————————————————————————————————————————

  const startSession = async () => {
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

  // —— Check if instruction mode should trigger ——————————————————————————

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

  // —— Submit answer ————————————————————————————————————————————————————

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
          optionsMap: question.options,
        }),
      });

      const data: AnswerResult = await res.json();
      if (!res.ok) throw new Error((data as any).error || 'Failed to submit answer');

      setResult(data);
      setTheta(data.theta.after);
      setThetaSd(data.theta.sd);
      setTotalAnswered((n) => n + 1);

      let newFailures = consecutiveFailures;
      if (data.correct) {
        setTotalCorrect((n) => n + 1);
        setConsecutiveFailures(0);
        newFailures = 0;
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

  // —— Handle "Review Material" button click ——————————————————————————————

  const handleReviewRequest = () => {
    setInstructionTrigger('user_request');
    setAppState('instruction');
  };

  // —— Handle instruction complete ————————————————————————————————————————

  const handleInstructionComplete = () => {
    setConsecutiveFailures(0);
    if (instructionTrigger === 'user_request' && question) {
      // User clicked "Review Material" mid-question — return to the same question
      setStartTime(Date.now());
      setAppState('question');
    } else {
      // Auto-triggered after wrong answer — fetch next question
      fetchNextQuestion(sessionId);
    }
  };

  // —— Handle next after feedback —————————————————————————————————————————

  const handleNextAfterFeedback = () => {
    const trigger = shouldTriggerInstruction(result!, consecutiveFailures);
    if (trigger) {
      setInstructionTrigger(trigger);
      setAppState('instruction');
    } else {
      fetchNextQuestion(sessionId);
    }
  };

  // —— Option button style ——————————————————————————————————————————————

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

  // ——— Auth handlers ————————————————————————————————————————————————————

  const handleAuth = async () => {
    setAuthError('');
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

  // —— Assessment flow helpers ————————————————————————————————————————

  const startAssessment = async (type: 'pre_test' | 'post_test' | 'delayed_post_test', linkedSessionId?: string) => {
    setAppState('loading');
    setAssessmentType(type);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId: linkedSessionId || null, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assessment');
      setAssessmentId(data.assessmentId);
      await fetchAssessmentQuestion(data.assessmentId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  };

  const fetchAssessmentQuestion = async (aId: string) => {
    try {
      const res = await fetch(`/api/assessments/${aId}/next-question`);
      const data = await res.json();
      if (data.completed) {
        setAssessmentScore({ score: data.score, maxScore: data.maxScore, passed: data.passed });
        setAssessmentQuestion(null);
        setAssessmentResult(null);
        setAssessmentSelected(null);
        setAppState('assessment');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to load question');
      setAssessmentQuestion(data);
      setAssessmentResult(null);
      setAssessmentSelected(null);
      setAppState('assessment');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  };

  const submitAssessmentAnswer = async (answer: string) => {
    if (!assessmentQuestion || !assessmentId) return;
    setAssessmentSelected(answer);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: assessmentQuestion.questionId,
          selectedAnswer: answer,
          optionsMap: assessmentQuestion.options,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit answer');
      setAssessmentResult(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  };

  const handleAssessmentNext = () => {
    if (assessmentId) fetchAssessmentQuestion(assessmentId);
  };

  const handleAssessmentComplete = () => {
    setAssessmentId(null);
    setAssessmentScore(null);
    if (assessmentType === 'pre_test') {
      // Pre-test done → proceed to main session
      startSession();
    } else {
      // Post-test or delayed → back to start
      setAppState('start');
    }
  };

  // ——— Render: Start Screen ———————————————————————————————————————————

  if (appState === 'start') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
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
              /* Logged in — show session options */
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

                <div>
                  <label className="block text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">
                    Condition
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['adaptive', 'static'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCondition(c)}
                        className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                          condition === c
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const queue = [...FOUNDATION_KCS];
                      setLearnQueue(queue);
                      learnQueueRef.current = queue;
                      startAssessment('pre_test');
                    }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all"
                  >
                    Learn First, Then Assess →
                  </button>
                  <button
                    onClick={() => startAssessment('pre_test')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-lg transition-all text-sm"
                  >
                    Skip to Assessment
                  </button>
                  <p className="text-slate-600 text-xs text-center">
                    New to UK Geography? Choose &quot;Learn First&quot; for guided instruction.
                  </p>
                </div>

                {delayedTestAvailable && (
                  <button
                    onClick={() => startAssessment('delayed_post_test', delayedTestAvailable.sessionId)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all text-sm"
                  >
                    Take Retention Test (7-day follow-up)
                  </button>
                )}

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
      </main>
    );
  }

  // ——— Render: Loading ————————————————————————————————————————————————

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

  // ——— Render: Error ——————————————————————————————————————————————————

  if (appState === 'error') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
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

  // ——— Render: Learning-First Onboarding ——————————————————————————————

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

  // ——— Render: Instruction Mode (mid-quiz remediation) ————————————————

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

  // ——— Render: Complete ———————————————————————————————————————————————

  if (appState === 'complete') {
    const handleNewSession = () => {
      setAppState('start');
      setSessionId('');
      setTotalAnswered(0);
      setTotalCorrect(0);
      setTheta(-0.780);
      setThetaSd(0.543);
      setConsecutiveFailures(0);
    };
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <SessionSummaryDashboard sessionId={sessionId} onNewSession={handleNewSession} />
          </div>
          <button
            onClick={() => startAssessment('post_test', sessionId)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
          >
            Take Post-Test →
          </button>
          <p className="text-slate-500 text-xs text-center">
            A retention test will be available in 7 days to measure long-term learning.
          </p>
        </div>
      </main>
    );
  }

  // ——— Render: Assessment (Pre/Post/Delayed Test) ——————————————————————

  if (appState === 'assessment') {
    const typeLabels: Record<string, string> = {
      pre_test: 'Pre-Test',
      post_test: 'Post-Test',
      delayed_post_test: 'Retention Test',
    };
    const typeLabel = typeLabels[assessmentType] || 'Assessment';

    // Score screen after completion
    if (assessmentScore && !assessmentQuestion) {
      return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono tracking-widest uppercase">
                {typeLabel} Complete
              </div>
              <div className="text-5xl font-bold text-white">
                {Math.round(assessmentScore.score * 100)}%
              </div>
              <p className="text-slate-400">
                You got {Math.round(assessmentScore.score * assessmentScore.maxScore)}/{assessmentScore.maxScore} questions correct
              </p>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                assessmentScore.passed
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              }`}>
                {assessmentScore.passed ? 'Passed' : 'Needs Improvement'}
              </div>
              <button
                onClick={handleAssessmentComplete}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
              >
                {assessmentType === 'pre_test' ? 'Continue to Learning →' : 'Done'}
              </button>
            </div>
          </div>
        </main>
      );
    }

    // Question screen
    if (assessmentQuestion) {
      const aTotal = (assessmentQuestion.meta.questionsAnswered || 0) + (assessmentQuestion.meta.questionsRemaining || 0);
      const aProgress = aTotal > 0 ? Math.round(((assessmentQuestion.meta.questionsAnswered || 0) / aTotal) * 100) : 0;

      const assessOptionStyle = (label: string) => {
        if (!assessmentResult) {
          return assessmentSelected === label
            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer';
        }
        if (label === assessmentResult.correctAnswer) return 'border-emerald-500 bg-emerald-50 text-emerald-900';
        if (label === assessmentResult.selectedAnswer && !assessmentResult.correct) return 'border-red-400 bg-red-50 text-red-900';
        return 'border-slate-200 bg-white text-slate-400';
      };

      return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {typeLabel}
                </span>
                <span>{assessmentQuestion.meta.questionsAnswered}/{aTotal}</span>
              </span>
            </div>

            <div className="h-1 w-full bg-slate-800 rounded-full">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${aProgress}%` }}
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${BLOOM_COLOURS[assessmentQuestion.bloom]}`}>
                  {BLOOM_LABELS[assessmentQuestion.bloom]}
                </span>
              </div>

              <h2 className="text-white text-lg font-medium leading-relaxed">
                {assessmentQuestion.text}
              </h2>

              <div className="space-y-3">
                {Object.entries(assessmentQuestion.options).map(([label, text]) => (
                  <button
                    key={label}
                    onClick={() => !assessmentResult && !assessmentSelected && submitAssessmentAnswer(label)}
                    disabled={!!assessmentResult || !!assessmentSelected}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${assessOptionStyle(label)}`}
                  >
                    <span className="font-mono font-bold text-sm mr-3 opacity-60">{label}</span>
                    <span className="text-sm">{text}</span>
                  </button>
                ))}
              </div>

              {assessmentResult && (
                <>
                  <div className={`rounded-xl p-4 border ${assessmentResult.correct ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-800'}`}>
                    <span className={`font-semibold text-sm ${assessmentResult.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {assessmentResult.correct ? '✅ Correct!' : `❌ Incorrect — answer was ${assessmentResult.correctAnswer}`}
                    </span>
                  </div>
                  <button
                    onClick={handleAssessmentNext}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
                  >
                    Next Question →
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      );
    }
  }

  // ——— Render: Question / Feedback —————————————————————————————————————

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
          <span>{totalCorrect} correct</span>
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
          <ThetaBar theta={theta} sd={thetaSd} />
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
                  📚 Review Material
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
                <button
                  key={label}
                  onClick={() => appState === 'question' && !selected && submitAnswer(label)}
                  disabled={appState === 'feedback' || !!selected}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${optionStyle(label)}`}
                >
                  <span className="font-mono font-bold text-sm mr-3 opacity-60">{label}</span>
                  <span className="text-sm">{text}</span>
                </button>
              ))}
            </div>

            {/* Feedback */}
            {appState === 'feedback' && result && (
              <div className={`rounded-xl p-4 border ${result.correct ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{result.correct ? '✅' : '❌'}</span>
                  <span className={`font-semibold text-sm ${result.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.correct ? 'Correct!' : `Incorrect — answer was ${result.correctAnswer}`}
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
                    {result.bkt.isMastered && <span className="ml-2 text-amber-400">★ Mastered</span>}
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
                      📚 Let's review this topic before continuing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cognitive Load Rating — compact inline */}
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

            {/* Hints (show after wrong answer) */}
            {appState === 'feedback' && result && !result.correct && question && (
              <HintPanel questionId={question.questionId} sessionId={sessionId} show={true} />
            )}

            {/* Next button */}
            {appState === 'feedback' && (
              <button
                onClick={handleNextAfterFeedback}
                className={`w-full py-4 font-semibold rounded-xl transition-all ${
                  willTriggerInstruction
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {willTriggerInstruction ? '📚 Review Material →' : 'Next Question →'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}



