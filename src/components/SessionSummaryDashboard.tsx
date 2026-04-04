'use client';
import { useState, useEffect } from 'react';
import LearningTrajectoryChart from '@/components/LearningTrajectoryChart';

interface KCPerformance {
  kcId: string;
  kcName: string;
  attempted: number;
  correct: number;
  accuracy: number;
  currentMastery: number;
}

interface ConfidenceCalibration {
  highConfCorrect: number;
  highConfWrong: number;
  lowConfCorrect: number;
  lowConfWrong: number;
  calibrationScore: number;
}

interface ErrorCluster {
  type: string;
  confidence: number;
  evidence: string[];
}

interface KCErrorProfile {
  kcId: string;
  kcName: string;
  bloomLevel: number;
  totalAttempts: number;
  errors: number;
  errorRate: number;
  clusters: ErrorCluster[];
  remediation: string;
}

interface ErrorFingerprint {
  overallErrorRate: number;
  dominantPattern: string;
  bloomVulnerabilities: Array<{ level: number; label: string; errorRate: number }>;
  kcProfiles: KCErrorProfile[];
  temporalPattern: {
    trend: string;
    earlyErrorRate: number;
    lateErrorRate: number;
    fatigueDetected: boolean;
  };
  remediationPlan: string[];
}

interface SummaryData {
  sessionId: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  avgResponseTimeMs: number;
  currentTheta: number;
  kcPerformance: KCPerformance[];
  confidenceCalibration: ConfidenceCalibration | null;
  areasForReview: KCPerformance[];
  feedbackMessage: string;
}

interface Props {
  sessionId: string;
  onNewSession: () => void;
}

// ─── Helper: Ability Level ────────────────────────────────────────────────────

function getAbilityLevel(theta: number): { label: string; colour: string; emoji: string } {
  if (theta >= 1.5) return { label: 'Expert', colour: 'text-emerald-400', emoji: '🏆' };
  if (theta >= 0.5) return { label: 'Competent', colour: 'text-blue-400', emoji: '⭐' };
  if (theta >= -0.5) return { label: 'Developing', colour: 'text-amber-400', emoji: '📈' };
  return { label: 'Beginner', colour: 'text-slate-400', emoji: '🌱' };
}

function getGrade(accuracy: number): { letter: string; colour: string } {
  if (accuracy >= 0.9) return { letter: 'A', colour: 'text-emerald-400' };
  if (accuracy >= 0.8) return { letter: 'B', colour: 'text-blue-400' };
  if (accuracy >= 0.7) return { letter: 'C', colour: 'text-amber-400' };
  if (accuracy >= 0.6) return { letter: 'D', colour: 'text-orange-400' };
  return { letter: 'F', colour: 'text-red-400' };
}

function getPatternEmoji(pattern: string): string {
  const map: Record<string, string> = {
    guessing: '🎲',
    misconception: '🔄',
    careless_error: '⚡',
    knowledge_gap: '📚',
    fatigue: '😴',
    none: '✅',
  };
  return map[pattern] || '📊';
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function ProgressRing({ value, size = 120, label, sublabel, colour }: {
  value: number; size?: number; label: string; sublabel?: string; colour: string;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(1, Math.max(0, value)) * circumference);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={colour} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-white">{label}</span>
        {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── KC Mastery Bar ───────────────────────────────────────────────────────────

function MasteryBar({ kc, errorProfile }: { kc: KCPerformance; errorProfile?: KCErrorProfile }) {
  const pct = Math.round(kc.currentMastery * 100);
  const barColour = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const statusIcon = pct >= 80 ? '✅' : pct >= 50 ? '🔶' : '🔴';
  const topCluster = errorProfile?.clusters?.[0];

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{statusIcon}</span>
          <span className="text-sm text-slate-300 font-medium">{kc.kcName}</span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {kc.correct}/{kc.attempted} · {pct}%
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColour} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {topCluster && topCluster.type !== 'none' && (
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>{getPatternEmoji(topCluster.type)}</span>
          <span className="capitalize">{topCluster.type.replace('_', ' ')}</span>
          <span className="text-slate-600">({Math.round(topCluster.confidence * 100)}% confidence)</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionSummaryDashboard({ sessionId, onNewSession }: Props) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [errorProfile, setErrorProfile] = useState<ErrorFingerprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'insights'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, errorRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}/summary`),
          fetch(`/api/analytics/error-patterns?sessionId=${sessionId}`),
        ]);

        if (!summaryRes.ok) throw new Error('Failed to load summary');
        const summaryJson = await summaryRes.json();
        setData(summaryJson);

        if (errorRes.ok) {
          const errorJson = await errorRes.json();
          setErrorProfile(errorJson);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-400 mt-4">Analysing your results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || 'Failed to load summary'}</p>
        <button onClick={onNewSession} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg">
          Start New Session
        </button>
      </div>
    );
  }

  const theta = data.currentTheta ?? 0;
  const ability = getAbilityLevel(theta);
  const grade = getGrade(data.accuracy);
  const masteredKCs = data.kcPerformance.filter((kc) => kc.currentMastery >= 0.8);
  const strugglingKCs = data.kcPerformance.filter((kc) => kc.currentMastery < 0.5);
  const avgResponseSec = (data.avgResponseTimeMs / 1000).toFixed(1);

  const errorProfileMap = new Map<string, KCErrorProfile>();
  if (errorProfile) {
    for (const p of errorProfile.kcProfiles) {
      errorProfileMap.set(p.kcId, p);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="text-center space-y-3">
        <div className="text-5xl">{ability.emoji}</div>
        <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
        <p className={`text-lg font-semibold ${ability.colour}`}>{ability.label} Level</p>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">{data.feedbackMessage}</p>
      </div>

      {/* ── Score Cards ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Score', value: `${data.correctCount}/${data.totalQuestions}`, sub: `${Math.round(data.accuracy * 100)}%` },
          { label: 'Grade', value: grade.letter, sub: grade.colour === 'text-emerald-400' ? 'Excellent' : 'Keep going' },
          { label: 'Ability', value: theta.toFixed(1), sub: `${ability.label}` },
          { label: 'Speed', value: `${avgResponseSec}s`, sub: 'avg' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white font-mono">{value}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{sub}</div>
            <div className="text-slate-600 text-[10px]">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Stats ── */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-400">{masteredKCs.length} KCs mastered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-400">{strugglingKCs.length} need work</span>
        </div>
        {errorProfile && (
          <div className="flex items-center gap-1.5">
            <span>{getPatternEmoji(errorProfile.dominantPattern)}</span>
            <span className="text-slate-400 capitalize">{errorProfile.dominantPattern.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex rounded-lg bg-slate-800 p-1">
        {(['overview', 'skills', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'overview' ? '📊 Progress' : tab === 'skills' ? '🎯 Skills' : '💡 Insights'}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <LearningTrajectoryChart sessionId={sessionId} />

          {/* Temporal trend */}
          {errorProfile?.temporalPattern && (
            <div className={`rounded-xl p-4 border ${
              errorProfile.temporalPattern.trend === 'improving'
                ? 'bg-emerald-950/30 border-emerald-800/50'
                : errorProfile.temporalPattern.trend === 'declining'
                  ? 'bg-red-950/30 border-red-800/50'
                  : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">
                  {errorProfile.temporalPattern.trend === 'improving' ? '📈' : errorProfile.temporalPattern.trend === 'declining' ? '📉' : '➡️'}
                </span>
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {errorProfile.temporalPattern.trend} performance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Early accuracy: {Math.round((1 - errorProfile.temporalPattern.earlyErrorRate) * 100)}% →
                Late accuracy: {Math.round((1 - errorProfile.temporalPattern.lateErrorRate) * 100)}%
                {errorProfile.temporalPattern.fatigueDetected && ' · Fatigue detected in final questions'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Skills ── */}
      {activeTab === 'skills' && (
        <div className="space-y-3">
          {data.kcPerformance.length > 0 ? (
            <>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Knowledge Components</h3>
              {data.kcPerformance
                .sort((a, b) => b.currentMastery - a.currentMastery)
                .map((kc) => (
                  <MasteryBar key={kc.kcId} kc={kc} errorProfile={errorProfileMap.get(kc.kcId)} />
                ))}
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No skill data available yet.</p>
          )}

          {/* Bloom level breakdown */}
          {errorProfile?.bloomVulnerabilities && errorProfile.bloomVulnerabilities.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 mt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Performance by Cognitive Level
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {errorProfile.bloomVulnerabilities.map((bloom) => {
                  const acc = Math.round((1 - bloom.errorRate) * 100);
                  return (
                    <div key={bloom.level} className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className={`text-lg font-bold ${acc >= 70 ? 'text-emerald-400' : acc >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {acc}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{bloom.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Insights ── */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Remediation Plan */}
          {errorProfile?.remediationPlan && errorProfile.remediationPlan.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Personalised Study Plan
              </h3>
              {errorProfile.remediationPlan.map((rec, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl p-4 border-l-4 border-indigo-500">
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-400 text-sm mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Areas for Review */}
          {data.areasForReview.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <span>📋</span> Priority Review Areas
              </h3>
              <div className="space-y-2">
                {data.areasForReview.slice(0, 5).map((kc) => (
                  <div key={kc.kcId} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{kc.kcName}</span>
                    <span className={`font-mono ${kc.currentMastery < 0.3 ? 'text-red-400' : 'text-amber-400'}`}>
                      {Math.round(kc.currentMastery * 100)}% mastery
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Calibration */}
          {data.confidenceCalibration && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Confidence Calibration</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-emerald-500/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-emerald-400">{data.confidenceCalibration.highConfCorrect}</div>
                  <div className="text-[10px] text-slate-500">Confident + Right</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-red-400">{data.confidenceCalibration.highConfWrong}</div>
                  <div className="text-[10px] text-slate-500">Confident + Wrong</div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-amber-400">{data.confidenceCalibration.lowConfCorrect}</div>
                  <div className="text-[10px] text-slate-500">Uncertain + Right</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-slate-400">{data.confidenceCalibration.lowConfWrong}</div>
                  <div className="text-[10px] text-slate-500">Uncertain + Wrong</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  data.confidenceCalibration.calibrationScore >= 0.7
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : data.confidenceCalibration.highConfWrong > data.confidenceCalibration.highConfCorrect
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {data.confidenceCalibration.calibrationScore >= 0.7
                    ? 'Well Calibrated'
                    : data.confidenceCalibration.highConfWrong > data.confidenceCalibration.highConfCorrect
                      ? 'Overconfident — slow down on uncertain questions'
                      : 'Underconfident — trust your knowledge more'}
                </span>
              </div>
            </div>
          )}

          {/* Session metadata */}
          <div className="bg-slate-800/30 rounded-xl p-3 text-xs text-slate-600 font-mono space-y-1">
            <div>Session: {sessionId.slice(0, 8)}...</div>
            <div>Avg Response: {data.avgResponseTimeMs}ms ({avgResponseSec}s)</div>
            <div>Ability Estimate: {theta.toFixed(3)} ({ability.label})</div>
          </div>
        </div>
      )}

      {/* ── CTA Button ── */}
      <button
        onClick={onNewSession}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
      >
        Start New Session
      </button>
    </div>
  );
}
