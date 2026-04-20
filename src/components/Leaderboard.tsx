'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

interface Entry {
  displayName: string;
  theta: number;
  gain: number;
  isYou: boolean;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => { if (d.entries) setEntries(d.entries); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-24 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (entries.length === 0) return (
    <div className="text-center py-6 text-slate-600 text-sm">
      No entries yet — be the first to complete a session.
    </div>
  );

  const medalColour = (i: number) =>
    i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-600';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Top gains — last 30 days</h3>
      </div>
      {entries.map((e, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            e.isYou
              ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'bg-slate-900/60 ring-1 ring-white/[0.04]'
          }`}
        >
          <span className={`text-sm font-bold w-5 shrink-0 ${medalColour(i)}`}>
            {i + 1}
          </span>
          <span className={`flex-1 text-sm font-medium ${e.isYou ? 'text-indigo-200' : 'text-slate-300'}`}>
            {e.displayName} {e.isYou && <span className="text-xs text-indigo-400 ml-1">you</span>}
          </span>
          <div className="flex items-center gap-1 text-xs font-mono">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className={`${e.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {e.gain >= 0 ? '+' : ''}{e.gain.toFixed(3)}
            </span>
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-700 text-center pt-1">First name + initial only · updated live</p>
    </div>
  );
}
