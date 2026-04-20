'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareCardProps {
  thetaGain: number;
  accuracy: number;
  sessionCount: number;
}

export default function ShareCard({ thetaGain, accuracy, sessionCount }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const gainStr = thetaGain >= 0 ? `+${thetaGain.toFixed(3)}` : thetaGain.toFixed(3);
  const accuracyPct = Math.round(accuracy * 100);

  const blocks = [
    thetaGain >= 0.3 ? '🟩' : thetaGain >= 0.1 ? '🟨' : '🟥',
    accuracyPct >= 80 ? '🟩' : accuracyPct >= 60 ? '🟨' : '🟥',
    sessionCount >= 3 ? '🟩' : sessionCount >= 1 ? '🟨' : '⬜',
  ].join('');

  const text = `GeoMentor · UK Geography\n${blocks}\nAbility gain: ${gainStr} θ\nAccuracy: ${accuracyPct}%\nSessions: ${sessionCount}\nhttps://e-learning-final-project.vercel.app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-[#0d1527] ring-1 ring-white/[0.06] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Share result</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-slate-800 text-slate-400 hover:text-white ring-1 ring-white/[0.06]'
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-400 whitespace-pre-line leading-relaxed">
        {text}
      </div>
    </div>
  );
}
