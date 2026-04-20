'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Participant {
  name: string;
  email: string;
  joined: string;
  session_id: string;
  condition: string;
  started: string;
  completed: string | null;
  duration_mins: number | null;
  initial_theta: number;
  final_theta: number;
  total_questions: number;
  correct: number;
  accuracy_pct: number | null;
  avg_response_secs: number | null;
  sus_score: number | null;
}

interface KCMastery {
  kc_id: string;
  avg_p_learned: number;
  mastered_count: number;
  total_count: number;
}

interface Stats {
  participants: Participant[];
  summary: {
    total_signups: number;
    completed_sessions: number;
    avg_theta_gain: number;
    sus: { count: number; avg_score: number; min_score: number; max_score: number };
  };
  kc_masteries: KCMastery[];
}

function thetaLabel(t: number) {
  if (t > 0.5) return 'High';
  if (t > -0.3) return 'Mid';
  return 'Low';
}

function susGrade(s: number) {
  if (s >= 80) return 'A';
  if (s >= 68) return 'B';
  if (s >= 50) return 'C';
  return 'D';
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 403) {
          router.replace('/');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </main>
    );
  }

  if (!stats) return null;

  const { participants, summary, kc_masteries } = stats;
  const real = participants.filter((p) => p.completed !== null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-xs text-indigo-400 uppercase tracking-widest mb-1">GeoMentor</p>
        <h1 className="text-2xl font-semibold text-white">Study Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Live participant data — admin only</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Signups', value: summary.total_signups },
          { label: 'Completed', value: summary.completed_sessions },
          {
            label: 'Avg θ gain',
            value: summary.avg_theta_gain > 0
              ? `+${summary.avg_theta_gain.toFixed(3)}`
              : summary.avg_theta_gain.toFixed(3),
          },
          {
            label: `SUS avg (n=${summary.sus.count})`,
            value: summary.sus.avg_score ? `${summary.sus.avg_score} ${susGrade(summary.sus.avg_score)}` : 'n/a',
          },
        ].map((c) => (
          <div key={c.label} className="bg-slate-900 border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-semibold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Participant table */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-3">Participants</h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Condition</th>
                <th className="text-right p-3">Questions</th>
                <th className="text-right p-3">Accuracy</th>
                <th className="text-right p-3">θ start</th>
                <th className="text-right p-3">θ end</th>
                <th className="text-right p-3">Gain</th>
                <th className="text-right p-3">Mins</th>
                <th className="text-right p-3">SUS</th>
                <th className="text-right p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => {
                const gain = p.completed ? Number(p.final_theta) - Number(p.initial_theta) : null;
                const isCompleted = p.completed !== null;
                return (
                  <tr
                    key={p.session_id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-3 text-white font-medium">{p.name}</td>
                    <td className="p-3 text-slate-400 text-xs">{p.email}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.condition === 'adaptive'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {p.condition}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-300">{p.total_questions}</td>
                    <td className="p-3 text-right text-slate-300">
                      {p.accuracy_pct != null ? `${p.accuracy_pct}%` : '-'}
                    </td>
                    <td className="p-3 text-right text-slate-500 text-xs">
                      {Number(p.initial_theta).toFixed(3)}
                    </td>
                    <td className="p-3 text-right text-slate-300 text-xs">
                      {isCompleted ? Number(p.final_theta).toFixed(3) : '-'}
                    </td>
                    <td className={`p-3 text-right text-xs font-medium ${
                      gain == null ? 'text-slate-600'
                      : gain > 0 ? 'text-emerald-400'
                      : 'text-red-400'
                    }`}>
                      {gain != null ? (gain > 0 ? `+${gain.toFixed(3)}` : gain.toFixed(3)) : '-'}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs">
                      {p.duration_mins != null ? p.duration_mins : '-'}
                    </td>
                    <td className="p-3 text-right">
                      {p.sus_score != null ? (
                        <span className={`text-xs font-medium ${
                          p.sus_score >= 80 ? 'text-emerald-400'
                          : p.sus_score >= 68 ? 'text-yellow-400'
                          : 'text-red-400'
                        }`}>
                          {p.sus_score} {susGrade(p.sus_score)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {isCompleted ? 'Done' : 'In progress'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KC Mastery breakdown */}
      {kc_masteries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-3">
            KC Mastery (across all participants)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {kc_masteries.map((kc) => (
              <div
                key={kc.kc_id}
                className="bg-slate-900 border border-white/[0.06] rounded-lg p-3 flex items-center gap-3"
              >
                <div className="flex-1">
                  <p className="text-xs text-white font-medium">{kc.kc_id.replace(/_/g, ' ')}</p>
                  <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.round(Number(kc.avg_p_learned) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-slate-200">
                    {Math.round(Number(kc.avg_p_learned) * 100)}%
                  </p>
                  <p className="text-xs text-slate-600">
                    {kc.mastered_count}/{kc.total_count}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats for dissertation */}
      {real.length > 0 && (
        <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-3">
            Dissertation numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">n (completed)</p>
              <p className="text-white font-semibold">{real.length}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Mean accuracy</p>
              <p className="text-white font-semibold">
                {(real.reduce((a, p) => a + (p.accuracy_pct || 0), 0) / real.length).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Mean session time</p>
              <p className="text-white font-semibold">
                {(real.reduce((a, p) => a + (p.duration_mins || 0), 0) / real.length).toFixed(1)} min
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">θ start (fixed)</p>
              <p className="text-white font-semibold">-0.780</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Mean θ end</p>
              <p className="text-white font-semibold">
                {(real.reduce((a, p) => a + Number(p.final_theta), 0) / real.length).toFixed(3)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">SUS (Brooke, 1996)</p>
              <p className="text-white font-semibold">
                {summary.sus.avg_score ? `${summary.sus.avg_score} (n=${summary.sus.count})` : 'pending'}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
