'use client';

import { X, Play, LogOut, ToggleLeft, ToggleRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PauseMenuProps {
  open: boolean;
  condition: 'adaptive' | 'static';
  questionsAnswered: number;
  questionsTotal: number;
  theta: number;
  onResume: () => void;
  onExit: () => void;
  onSwitchMode: (mode: 'adaptive' | 'static') => void;
}

export default function PauseMenu({
  open,
  condition,
  questionsAnswered,
  questionsTotal,
  theta,
  onResume,
  onExit,
  onSwitchMode,
}: PauseMenuProps) {
  const otherMode = condition === 'adaptive' ? 'static' : 'adaptive';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onResume}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1527] border-t border-white/[0.08] rounded-t-2xl max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="p-6 space-y-5">
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">Session paused</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {questionsAnswered}/{questionsTotal} answered · θ {theta.toFixed(3)}
                  </p>
                </div>
                <button
                  onClick={onResume}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode indicator */}
              <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Current mode</p>
                  <div className="flex items-center gap-2">
                    {condition === 'adaptive'
                      ? <ToggleRight className="w-4 h-4 text-indigo-400" />
                      : <ToggleLeft className="w-4 h-4 text-slate-500" />
                    }
                    <span className={`text-sm font-semibold capitalize ${
                      condition === 'adaptive' ? 'text-indigo-300' : 'text-slate-300'
                    }`}>
                      {condition}
                    </span>
                    {condition === 'adaptive' && (
                      <span className="text-xs text-slate-600">· IRT + BKT active</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onSwitchMode(otherMode)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 ring-1 ring-white/[0.06] text-slate-400 hover:text-white hover:ring-indigo-500/40 transition-all"
                >
                  Switch to {otherMode}
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={onResume}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
                >
                  <Play className="w-4 h-4" />
                  Continue session
                </button>
                <button
                  onClick={onExit}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 ring-1 ring-white/[0.06] text-slate-400 hover:text-white hover:ring-white/10 text-sm transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Save and exit
                </button>
              </div>

              <p className="text-xs text-slate-600 text-center">
                Your progress is saved. You can resume anytime.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
