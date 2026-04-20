'use client';

import { useEffect, useRef, useState } from 'react';
import { Trophy, ArrowUp, ArrowDown, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Entry {
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  isYou: boolean;
}

interface RankedEntry extends Entry {
  rank: number;
  prevRank: number | null;
  rankDelta: number | null;
}

const STORAGE_KEY = 'gm_prev_leaderboard';

function loadPrevRanks(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePrevRanks(entries: RankedEntry[]) {
  const map: Record<string, number> = {};
  entries.forEach((e) => { map[e.displayName] = e.rank; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

const medalColour = (i: number) =>
  i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-600';

export default function Leaderboard() {
  const [entries, setEntries] = useState<RankedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const prevRanksRef = useRef<Record<string, number>>({});

  useEffect(() => {
    prevRanksRef.current = loadPrevRanks();

    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d: { entries?: Entry[] }) => {
        if (!d.entries) return;
        const ranked: RankedEntry[] = d.entries.map((e, i) => {
          const rank = i + 1;
          const prevRank = prevRanksRef.current[e.displayName] ?? null;
          return {
            ...e,
            rank,
            prevRank,
            rankDelta: prevRank !== null ? prevRank - rank : null,
          };
        });
        setEntries(ranked);
        savePrevRanks(ranked);
      })
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
      No entries yet — complete a session and join the leaderboard.
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Top learners</h3>
      </div>

      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.div
            key={e.displayName}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              e.isYou
                ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30'
                : 'bg-slate-900/60 ring-1 ring-white/[0.04]'
            }`}
          >
            {/* Rank */}
            <span className={`text-sm font-bold w-5 shrink-0 ${medalColour(e.rank - 1)}`}>
              {e.rank}
            </span>

            {/* Name */}
            <span className={`flex-1 text-sm font-medium ${e.isYou ? 'text-indigo-200' : 'text-slate-300'}`}>
              {e.displayName}
              {e.isYou && <span className="text-xs text-indigo-400 ml-1.5">you</span>}
            </span>

            {/* Streak */}
            {e.streak > 1 && (
              <div className="flex items-center gap-0.5 text-xs text-orange-400">
                <Flame className="w-3 h-3" />
                <span>{e.streak}</span>
              </div>
            )}

            {/* XP */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className={e.isYou ? 'text-indigo-300' : 'text-slate-400'}>
                {e.xp.toLocaleString()}
              </span>
            </div>

            {/* Rank delta */}
            {e.rankDelta !== null && e.rankDelta !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-0.5 text-xs font-semibold ${
                  e.rankDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {e.rankDelta > 0
                  ? <ArrowUp className="w-3 h-3" />
                  : <ArrowDown className="w-3 h-3" />}
                {Math.abs(e.rankDelta)}
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <p className="text-xs text-slate-700 text-center pt-1">First name + initial only · opted-in users only</p>
    </div>
  );
}
