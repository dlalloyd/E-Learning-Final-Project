'use client';

import { useState, useCallback } from 'react';
import InstructionMode from '@/components/InstructionMode';
import SessionSummaryDashboard from '@/components/SessionSummaryDashboard';

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

type AppState = 'start' | 'loading' | 'question' | 'feedback' | 'instruction' | 'complete' | 'error';
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
  const [condition, setCondition] = useState<'adaptive' | 'static'>('adaptive');
  const [sessionId, setSessionId] = useState('');
  const [theta, setTheta] = useState(-0.780);
  const [thetaSd, setThetaSd] = useState(0.543);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // ——— Instruction Mode State ———
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [currentKcId, setCurrentKcId] = useState<string>('');
  const [instructionTrigger, setInstructionTrigger] = useState<InstructionTrigger>('low_mastery');

  // —— Fetch next question ——————————————————————————————————————————————

  const fetchNextQuestion = useCallback(async (sid: string) => {
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
        setConfidence(null);
        setResult(null);
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

  const submitAnswer = async (answer: string, confidenceLevel: 1 | 2 | 3) => {
    if (!question || !sessionId) return;
    setSelected(answer);

    const responseTimeMs = Date.now() - startTime;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.questionId,
          selectedAnswer: answer,
          responseTimeMs,
          confidenceLevel,
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
    fetchNextQuestion(sessionId);
  };

  // —— Handle next after feedback —————————————————————————————————————————

  const handleNextAfterFeedback = () => {
    console.log('=== INSTRUCTION CHECK ===');
    console.log('condition:', condition);
    console.log('result.correct:', result?.correct);
    console.log('consecutiveFailures:', consecutiveFailures);
    console.log('bkt.pLearned_after:', result?.bkt.pLearned_after);
    console.log('MASTERY_THRESHOLD:', MASTERY_THRESHOLD);
    console.log('CONSECUTIVE_FAIL_THRESHOLD:', CONSECUTIVE_FAIL_THRESHOLD);

    const trigger = shouldTriggerInstruction(result!, consecutiveFailures);
    console.log('trigger result:', trigger);

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

  // ——— Render: Start Screen ———————————————————————————————————————————

  if (appState === 'start') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono tracking-widest uppercase">
              Adaptive E-Learning System
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              UK Geography Assessment
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              IRT 3PL · Bayesian Knowledge Tracing · Vygotsky ZPD
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">
                Participant ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startSession()}
                placeholder="Enter your user ID"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

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

            <button
              onClick={startSession}
              disabled={!userId.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
            >
              Begin Assessment →
            </button>
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

  // ——— Render: Instruction Mode ————————————————————————————————————————

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
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <SessionSummaryDashboard sessionId={sessionId} onNewSession={handleNewSession} />
          </div>
        </div>
      </main>
    );
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
                  onClick={() => appState === 'question' && !selected && setSelected(label)}
                  disabled={appState === 'feedback'}
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



