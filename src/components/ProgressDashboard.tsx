/**
 * Cross-Session Progress Dashboard (Feature 2)
 * Shows longitudinal learning progress, knowledge decay (Feature 7),
 * peer comparison (Feature 8), and adaptive goals (Feature 9).
 */
'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Target, Clock, Brain,
  Users, Award, AlertTriangle, CheckCircle2, RefreshCw,
  BarChart3, Layers, Zap, BookOpen, ChevronRight,
} from 'lucide-react';

interface SessionPoint {
  sessionId: string;
  date: string;
  theta: number;
  accuracy: number;
  totalQuestions: number;
  correct: number;
  avgResponseTimeMs: number;
  condition: string;
}

interface KCProgress {
  kcId: string;
  kcName: string;
  storedPLearned: number;
  decayedPLearned: number;
  daysSinceLastPractice: number;
  needsReview: boolean;
  lastPracticed: string;
}

interface ProgressData {
  sessionTimeline: SessionPoint[];
  kcProgress: KCProgress[];
  stats: {
    totalSessions: number;
    currentTheta: number;
    totalMastered: number;
    totalDecayed: number;
    totalKCs: number;
    overallProgress: number;
  };
  conditionRecommendation: string | null;
}

interface PeerData {
  available: boolean;
  totalLearners?: number;
  you?: { theta: number; percentile: number; masteredKCs: number; masteryPercentile: number };
  cohort?: { meanTheta: number; medianTheta: number; avgMasteredKCs: number };
}

interface GoalData {
  goals: Array<{
    id: string;
    goalType: string;
    targetValue: number;
    currentValue: number;
    achieved: boolean;
  }>;
}

interface Props {
  onStartSession: () => void;
  onStartReview: (kcId: string) => void;
}

export default function ProgressDashboard({ onStartSession, onStartReview }: Props) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [peers, setPeers] = useState<PeerData | null>(null);
  const [goals, setGoals] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/progress').then((r) => r.ok ? r.json() : null),
      fetch('/api/peer-stats').then((r) => r.ok ? r.json() : null),
      fetch('/api/goals').then((r) => r.ok ? r.json() : null),
    ]).then(([progressData, peerData, goalData]) => {
      setData(progressData);
      setPeers(peerData);
      setGoals(goalData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.sessionTimeline.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <BookOpen size={32} className="text-slate-600 mx-auto" />
        <p className="text-slate-400 text-sm">Complete your first session to see progress.</p>
        <button onClick={onStartSession} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium">
          Start Learning
        </button>
      </div>
    );
  }

  const { stats, kcProgress, sessionTimeline, conditionRecommendation } = data;
  const decayedKCs = kcProgress.filter((k) => k.needsReview);
  const activeGoal = goals?.goals?.find((g) => !g.achieved);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={<Layers size={14} />} label="Sessions" value={String(stats.totalSessions)} />
        <StatCard icon={<Target size={14} />} label="Mastered" value={`${stats.totalMastered}/${stats.totalKCs}`} />
        <StatCard icon={<TrendingUp size={14} />} label="Ability" value={stats.currentTheta.toFixed(1)} />
        <StatCard icon={<BarChart3 size={14} />} label="Progress" value={`${stats.overallProgress}%`} />
      </div>

      {/* Goal progress */}
      {activeGoal && (
        <div className="bg-indigo-950/40 border border-indigo-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Your Goal</span>
          </div>
          <p className="text-slate-300 text-sm mb-2">
            Master {activeGoal.targetValue} topics (currently at {activeGoal.currentValue})
          </p>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (activeGoal.currentValue / activeGoal.targetValue) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {Math.round((activeGoal.currentValue / activeGoal.targetValue) * 100)}% complete
          </p>
        </div>
      )}

      {/* Knowledge decay warnings */}
      {decayedKCs.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              {decayedKCs.length} topic{decayedKCs.length !== 1 ? 's' : ''} fading from memory
            </span>
          </div>
          <div className="space-y-2">
            {decayedKCs.slice(0, 3).map((kc) => (
              <div key={kc.kcId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw size={12} className="text-amber-500" />
                  <span className="text-xs text-slate-300">{kc.kcName}</span>
                  <span className="text-[10px] text-slate-600">
                    ({Math.round(kc.daysSinceLastPractice)}d ago, {Math.round(kc.decayedPLearned * 100)}%)
                  </span>
                </div>
                <button
                  onClick={() => onStartReview(kc.kcId)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                >
                  Review <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theta trajectory mini-chart */}
      {sessionTimeline.length >= 2 && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ability Over Time</h3>
          <div className="flex items-end gap-1 h-16">
            {sessionTimeline.map((s, i) => {
              const range = Math.max(...sessionTimeline.map((p) => p.theta)) - Math.min(...sessionTimeline.map((p) => p.theta));
              const min = Math.min(...sessionTimeline.map((p) => p.theta));
              const height = range > 0 ? ((s.theta - min) / range) * 100 : 50;
              return (
                <div
                  key={i}
                  className="flex-1 bg-indigo-500/60 hover:bg-indigo-500 rounded-t transition-all"
                  style={{ height: `${Math.max(10, height)}%` }}
                  title={`Session ${i + 1}: theta ${s.theta.toFixed(2)}, ${Math.round(s.accuracy * 100)}% accuracy`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>Session 1</span>
            <span>Session {sessionTimeline.length}</span>
          </div>
        </div>
      )}

      {/* Peer comparison */}
      {peers?.available && peers.you && peers.cohort && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compared to {peers.totalLearners} Learners</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-400 font-mono">{peers.you.percentile}th</div>
              <div className="text-[10px] text-slate-500">Ability percentile</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400 font-mono">{peers.you.masteryPercentile}th</div>
              <div className="text-[10px] text-slate-500">Mastery percentile</div>
            </div>
          </div>
        </div>
      )}

      {/* Condition escalation */}
      {conditionRecommendation && (
        <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-4 flex items-center gap-3">
          <Zap size={16} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm text-emerald-300 font-medium">Ready for a challenge?</p>
            <p className="text-xs text-slate-400">Your performance suggests you could benefit from adaptive mode.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={onStartSession}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all"
      >
        Start New Session
      </button>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">{icon}</div>
      <div className="text-base sm:text-lg font-bold text-white font-mono">{value}</div>
      <div className="text-[10px] text-slate-600">{label}</div>
    </div>
  );
}
