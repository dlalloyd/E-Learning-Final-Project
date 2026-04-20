'use client';
import { useState, useEffect } from 'react';
import LearningTrajectoryChart from '@/components/LearningTrajectoryChart';
import {
  Trophy, Star, TrendingUp, Sprout,
  Dices, RefreshCw, Zap, BookOpen, Moon, CheckCircle2,
  BarChart3, Target, Lightbulb, ClipboardList,
  Circle, Diamond, TrendingDown, ArrowRight, XCircle,
  AlertTriangle, Map as MapIcon, Brain, Navigation,
} from 'lucide-react';

interface KCPerformance {
  kcId: string;
  kcName: string;
  attempted: number;
  correct: number;
  accuracy: number;
  currentMastery: number;
  hintsUsed: number;
  hintLevelMax: number;
}

interface ConfidenceCalibration {
  highConfCorrect: number;
  highConfWrong: number;
  lowConfCorrect: number;
  lowConfWrong: number;
  calibrationScore: number;
}

interface Distractor {
  kcName: string;
  timesChosenWrong: number;
  correctAnswer: string;
}

interface Longitudinal {
  priorSessionCount: number;
  avgPriorTheta: number;
  deltaTheta: number;
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
  topDistractors: Distractor[];
  longitudinal: Longitudinal | null;
  narrative: string;
}

interface Props {
  sessionId: string;
  onNewSession: () => void;
  onStartReview?: (kcId: string) => void;
}

type TabId = 'journey' | 'trajectory' | 'skills' | 'misconceptions' | 'next-steps';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'journey',        label: 'Journey',   icon: <MapIcon className="w-3 h-3" /> },
  { id: 'trajectory',    label: 'Chart',      icon: <TrendingUp className="w-3 h-3" /> },
  { id: 'skills',        label: 'Skills',     icon: <Target className="w-3 h-3" /> },
  { id: 'misconceptions', label: 'Errors',    icon: <Brain className="w-3 h-3" /> },
  { id: 'next-steps',    label: 'Next Steps', icon: <Navigation className="w-3 h-3" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAbilityLevel(theta: number): { label: string; colour: string; icon: React.ReactNode } {
  if (theta >= 1.5) return { label: 'Expert',     colour: 'text-emerald-400', icon: <Trophy   className="w-5 h-5 text-emerald-400" /> };
  if (theta >= 0.5) return { label: 'Competent',  colour: 'text-blue-400',   icon: <Star     className="w-5 h-5 text-blue-400"   /> };
  if (theta >= -0.5) return { label: 'Developing', colour: 'text-amber-400', icon: <TrendingUp className="w-5 h-5 text-amber-400" /> };
  return                    { label: 'Beginner',   colour: 'text-slate-400', icon: <Sprout   className="w-5 h-5 text-slate-400"   /> };
}

function getGrade(accuracy: number): { letter: string; colour: string } {
  if (accuracy >= 0.9) return { letter: 'A', colour: 'text-emerald-400' };
  if (accuracy >= 0.8) return { letter: 'B', colour: 'text-blue-400' };
  if (accuracy >= 0.7) return { letter: 'C', colour: 'text-amber-400' };
  if (accuracy >= 0.6) return { letter: 'D', colour: 'text-orange-400' };
  return                      { letter: 'F', colour: 'text-red-400' };
}

function getPatternIcon(pattern: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    guessing:      <Dices        className="w-4 h-4 text-purple-400" />,
    misconception: <RefreshCw    className="w-4 h-4 text-orange-400" />,
    careless_error:<Zap          className="w-4 h-4 text-yellow-400" />,
    knowledge_gap: <BookOpen     className="w-4 h-4 text-red-400"    />,
    fatigue:       <Moon         className="w-4 h-4 text-slate-400"  />,
    none:          <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  };
  return map[pattern] || <BarChart3 className="w-4 h-4 text-slate-400" />;
}

function hintLabel(level: number): string {
  return level === 0 ? 'No hints' : level === 1 ? 'Conceptual hint' : level === 2 ? 'Procedural hint' : 'Worked example';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MasteryBar({ kc, errorProfile }: { kc: KCPerformance; errorProfile?: KCErrorProfile }) {
  const pct = Math.round(kc.currentMastery * 100);
  const barColour = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const statusIcon = pct >= 80
    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    : pct >= 50
      ? <Diamond className="w-4 h-4 text-amber-400" />
      : <Circle className="w-4 h-4 text-red-400 fill-red-400" />;
  const topCluster = errorProfile?.clusters?.[0];

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-sm text-slate-300 font-medium">{kc.kcName}</span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {kc.correct}/{kc.attempted} · {pct}%
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColour} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-600">
        {topCluster && topCluster.type !== 'none' ? (
          <span className="flex items-center gap-1">
            {getPatternIcon(topCluster.type)}
            <span className="capitalize">{topCluster.type.replace('_', ' ')}</span>
          </span>
        ) : <span />}
        {kc.hintsUsed > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <Lightbulb className="w-3 h-3" />
            {kc.hintsUsed} hint{kc.hintsUsed !== 1 ? 's' : ''} ({hintLabel(kc.hintLevelMax)})
          </span>
        )}
      </div>
    </div>
  );
}

function LongitudinalBlock({ longitudinal, currentTheta }: { longitudinal: Longitudinal; currentTheta: number }) {
  const delta = longitudinal.deltaTheta;
  const improved = delta > 0;
  const significant = Math.abs(delta) >= 0.1;

  return (
    <div className={`rounded-xl p-4 border ${
      improved ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-amber-950/30 border-amber-800/40'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {improved
          ? <TrendingUp className="w-4 h-4 text-emerald-400" />
          : <TrendingDown className="w-4 h-4 text-amber-400" />}
        <span className="text-sm font-semibold text-slate-200">
          Compared to your last {longitudinal.priorSessionCount} session{longitudinal.priorSessionCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-slate-500 mb-1">Prior avg</div>
          <div className="font-mono text-sm text-slate-300">{longitudinal.avgPriorTheta.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Now</div>
          <div className="font-mono text-sm text-white">{currentTheta.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Change</div>
          <div className={`font-mono text-sm font-bold ${improved ? 'text-emerald-400' : 'text-amber-400'}`}>
            {improved ? '+' : ''}{delta.toFixed(2)}
          </div>
        </div>
      </div>
      {!significant && (
        <p className="text-[10px] text-slate-600 mt-2 text-center">Ability estimate stable across sessions</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionSummaryDashboard({ sessionId, onNewSession, onStartReview }: Props) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [errorProfile, setErrorProfile] = useState<ErrorFingerprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('journey');

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
    for (const p of errorProfile.kcProfiles) errorProfileMap.set(p.kcId, p);
  }

  return (
    <div className="space-y-6">
      {/* ── Score Cards (always visible) ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Score',  value: `${data.correctCount}/${data.totalQuestions}`, sub: `${Math.round(data.accuracy * 100)}%` },
          { label: 'Grade',  value: grade.letter, sub: grade.colour === 'text-emerald-400' ? 'Excellent' : 'Keep going' },
          { label: 'Ability', value: theta.toFixed(1), sub: ability.label },
          { label: 'Speed',  value: `${avgResponseSec}s`, sub: 'avg' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white font-mono">{value}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{sub}</div>
            <div className="text-slate-600 text-[10px]">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex rounded-lg bg-slate-800 p-1 overflow-x-auto gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max py-2 px-2 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              {tab.icon} {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab: Journey ── */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          {/* Narrative hero */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              {ability.icon}
              <div>
                <div className={`text-lg font-bold ${ability.colour}`}>{ability.label} Level</div>
                <div className="text-xs text-slate-500">Ability estimate</div>
              </div>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              {data.narrative || data.feedbackMessage}
            </p>
          </div>

          {/* Quick stat pills */}
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800/30">
              <CheckCircle2 className="w-3 h-3" /> {masteredKCs.length} KC{masteredKCs.length !== 1 ? 's' : ''} mastered
            </span>
            {strugglingKCs.length > 0 && (
              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-800/30">
                <AlertTriangle className="w-3 h-3" /> {strugglingKCs.length} need{strugglingKCs.length === 1 ? 's' : ''} work
              </span>
            )}
            {errorProfile && (
              <span className="flex items-center gap-1.5 bg-slate-700/50 text-slate-400 px-3 py-1.5 rounded-full border border-slate-700/50">
                {getPatternIcon(errorProfile.dominantPattern)}
                <span className="capitalize">{errorProfile.dominantPattern.replace('_', ' ')}</span>
              </span>
            )}
          </div>

          {/* Longitudinal block */}
          {data.longitudinal && data.longitudinal.priorSessionCount > 0 && (
            <LongitudinalBlock longitudinal={data.longitudinal} currentTheta={theta} />
          )}
        </div>
      )}

      {/* ── Tab: Trajectory ── */}
      {activeTab === 'trajectory' && (
        <div className="space-y-4">
          <LearningTrajectoryChart sessionId={sessionId} />

          {errorProfile?.temporalPattern && (
            <div className={`rounded-xl p-4 border ${
              errorProfile.temporalPattern.trend === 'improving'
                ? 'bg-emerald-950/30 border-emerald-800/50'
                : errorProfile.temporalPattern.trend === 'declining'
                  ? 'bg-red-950/30 border-red-800/50'
                  : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {errorProfile.temporalPattern.trend === 'improving'
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : errorProfile.temporalPattern.trend === 'declining'
                    ? <TrendingDown className="w-4 h-4 text-red-400" />
                    : <ArrowRight className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {errorProfile.temporalPattern.trend} performance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Early accuracy: {Math.round((1 - errorProfile.temporalPattern.earlyErrorRate) * 100)}% then
                late accuracy: {Math.round((1 - errorProfile.temporalPattern.lateErrorRate) * 100)}%
                {errorProfile.temporalPattern.fatigueDetected && '. Fatigue detected in final questions.'}
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

          {/* Confidence calibration quad */}
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
                      ? 'Overconfident. Slow down on uncertain questions.'
                      : 'Underconfident. Trust your knowledge more.'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Misconceptions ── */}
      {activeTab === 'misconceptions' && (
        <div className="space-y-4">
          {data.topDistractors && data.topDistractors.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Attractive Wrong Answers
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                These distractors were chosen incorrectly. Understanding why reveals specific misconceptions.
              </p>
              <div className="space-y-3">
                {data.topDistractors.map((d, i) => (
                  <div key={i} className="bg-red-950/20 border border-red-800/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-slate-300 font-medium">{d.kcName}</span>
                      <span className="text-xs text-red-400 font-mono whitespace-nowrap">
                        {d.timesChosenWrong}x wrong
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-slate-400">Chose the wrong answer instead of:</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-300 font-medium">{d.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error pattern clusters from fingerprint */}
              {errorProfile && errorProfile.kcProfiles.filter((p) => p.errors > 0).length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Error Patterns by KC
                  </h3>
                  <div className="space-y-2">
                    {errorProfile.kcProfiles
                      .filter((p) => p.errors > 0)
                      .slice(0, 5)
                      .map((profile) => (
                        <div key={profile.kcId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {getPatternIcon(profile.clusters[0]?.type || 'none')}
                            <span className="text-slate-300">{profile.kcName}</span>
                          </div>
                          <span className="text-slate-500 font-mono">
                            {profile.errors}/{profile.totalAttempts} errors
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-slate-400 text-sm">No significant misconceptions detected.</p>
              <p className="text-slate-600 text-xs">Wrong answers were distributed across different questions without a clear pattern.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Next Steps ── */}
      {activeTab === 'next-steps' && (
        <div className="space-y-4">
          {/* Remediation Plan */}
          {errorProfile?.remediationPlan && errorProfile.remediationPlan.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Personalised Study Plan
              </h3>
              {errorProfile.remediationPlan.map((rec, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl p-4 border-l-4 border-indigo-500">
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-400 text-sm mt-0.5 font-mono">{i + 1}.</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/60 rounded-xl p-4 border-l-4 border-emerald-500">
              <p className="text-sm text-slate-300">Strong performance. Continue to the next session to maintain mastery.</p>
            </div>
          )}

          {/* Priority Review Areas — with drill CTA */}
          {data.areasForReview.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Focus on these next
              </h3>
              {data.areasForReview.slice(0, 3).map((kc) => (
                <div key={kc.kcId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{kc.kcName}</p>
                    <p className={`text-xs font-mono mt-0.5 ${kc.currentMastery < 0.3 ? 'text-red-400' : 'text-amber-400'}`}>
                      {Math.round(kc.currentMastery * 100)}% mastery
                    </p>
                  </div>
                  {onStartReview && (
                    <button
                      onClick={() => onStartReview(kc.kcId)}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold transition-all whitespace-nowrap"
                    >
                      Drill this
                    </button>
                  )}
                </div>
              ))}
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
