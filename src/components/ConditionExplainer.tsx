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

interface Props {
  onChoose: (condition: 'adaptive' | 'static') => void;
}

const ADAPTIVE_BULLETS = [
  'Real-time calibration of question difficulty',
  'Optimized for rapid mastery acquisition',
  'Personalized cognitive load management',
];

const STATIC_BULLETS = [
  'Linear progression across defined modules',
  'Static difficulty regardless of response patterns',
  'Uniform assessment for peer benchmarking',
];

export default function ConditionExplainer({ onChoose }: Props) {
  const handleChoose = (condition: 'adaptive' | 'static') => {
    try {
      localStorage.setItem('gm_condition_explainer_seen', 'true');
    } catch { /* ignore */ }
    onChoose(condition);
  };

  return (
    <div className="relative w-full">
      {/* Blur glow decorations */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2 mb-6 relative z-10">
        <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase block">
          System Configuration
        </span>
        <h2 className="text-white font-black text-xl tracking-tighter">
          Choose Your Assessment Protocol
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
          Select the methodology for your session. Both modes use the same question bank but differ in how they respond to your performance.
        </p>
      </div>

      {/* Cards — divided layout from Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden ring-1 ring-white/[0.06] relative z-10">
        {/* Adaptive */}
        <div className="bg-[#060e1d] p-6 sm:p-8 flex flex-col gap-6 hover:bg-[#0d1527] transition-colors group">
          <div className="space-y-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 text-indigo-400">
              {/* Brain/psychology icon via SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.007.002c.464.207.79.678.79 1.189v.001c0 .638-.516 1.154-1.154 1.154h-7.5A1.154 1.154 0 016.75 16.47v-.001c0-.511.326-.982.79-1.189l.007-.002A2.25 2.25 0 009 13.228V7.514m4.5-4.41c.251.023.501.05.75.082M14.25 3.104A24.3 24.3 0 0112 3c-.795 0-1.576.036-2.25.104" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Adaptive Learning</h3>
              <p className="text-slate-400 text-xs font-mono mt-0.5">IRT 3PL + BKT engine</p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A dynamic experience where the system recalibrates complexity in real time using Item Response Theory and Bayesian Knowledge Tracing.
            </p>
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">Key Methodologies</span>
              <ul className="space-y-2.5">
                {ADAPTIVE_BULLETS.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => handleChoose('adaptive')}
            className="mt-auto w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all active:scale-[0.98] ring-1 ring-white/10"
          >
            Choose Adaptive
          </button>
        </div>

        {/* Static */}
        <div className="bg-[#060e1d] p-6 sm:p-8 flex flex-col gap-6 hover:bg-[#0d1527] transition-colors group">
          <div className="space-y-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700/50 ring-1 ring-white/10 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Static Baseline</h3>
              <p className="text-slate-500 text-xs font-mono mt-0.5">Fixed sequence</p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A fixed-difficulty environment designed for baseline performance measurement and standardised comparison metrics.
            </p>
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">Key Methodologies</span>
              <ul className="space-y-2.5">
                {STATIC_BULLETS.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => handleChoose('static')}
            className="mt-auto w-full py-3 px-5 bg-[#222a3a] hover:bg-[#2d3546] text-slate-200 text-sm font-bold rounded-lg transition-all active:scale-[0.98] ring-1 ring-white/10"
          >
            Choose Static
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-1 relative z-10">
        <p className="text-slate-600 text-xs flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Protocol can be switched at the start of each new session
        </p>
        <p className="text-slate-600 text-xs">University of Hull · 2026</p>
      </div>
    </div>
  );
}
