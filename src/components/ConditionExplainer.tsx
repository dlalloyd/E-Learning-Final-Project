'use client';

/**
 * ConditionExplainer
 *
 * Shown once per user before their first session start.
 * Explains adaptive vs static conditions so they can make an informed choice.
 *
 * Research context: within-subjects A/B design (Bengi, 2026 dissertation).
 * Users are encouraged to try both conditions across sessions.
 *
 * Persists seen state to localStorage ('gm_condition_explainer_seen').
 */

import { Brain, BarChart2, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  onChoose: (condition: 'adaptive' | 'static') => void;
}

const ADAPTIVE_BULLETS = [
  'Questions adjust to your current ability in real time',
  'Harder questions when you are doing well, easier when you struggle',
  'Instruction mode activates if you hit a knowledge gap',
  'Uses Item Response Theory + Bayesian Knowledge Tracing',
];

const STATIC_BULLETS = [
  'Questions are presented in a fixed difficulty sequence',
  'No real-time adjustment based on your performance',
  'Same experience for every learner, every time',
  'Useful as a comparison baseline for the research',
];

export default function ConditionExplainer({ onChoose }: Props) {
  const handleChoose = (condition: 'adaptive' | 'static') => {
    try {
      localStorage.setItem('gm_condition_explainer_seen', 'true');
    } catch { /* ignore */ }
    onChoose(condition);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-white font-black text-xl tracking-tight">Choose your learning mode</h2>
        <p className="text-slate-400 text-sm">
          This system has two modes. Try both across sessions — your data helps a University of Hull dissertation.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Adaptive */}
        <div className="bg-slate-800/60 ring-1 ring-indigo-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-lg">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Adaptive</h3>
              <p className="text-indigo-400 text-xs font-mono">IRT + BKT engine</p>
            </div>
          </div>
          <ul className="space-y-2">
            {ADAPTIVE_BULLETS.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleChoose('adaptive')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
          >
            Start Adaptive
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Static */}
        <div className="bg-slate-800/60 ring-1 ring-slate-600/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-700/50 rounded-lg">
              <BarChart2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Static</h3>
              <p className="text-slate-500 text-xs font-mono">Fixed sequence</p>
            </div>
          </div>
          <ul className="space-y-2">
            {STATIC_BULLETS.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleChoose('static')}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
          >
            Start Static
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-center text-slate-600 text-xs">
        You can switch modes at the start of each new session. No wrong choice.
      </p>
    </div>
  );
}
