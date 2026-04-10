'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  children?: React.ReactNode;
}

/**
 * CSS-only hover tooltip with a small help icon.
 * Wraps any element and shows an explanatory popover on hover.
 */
export default function HelpTooltip({ text, children }: HelpTooltipProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (for mobile tap)
  useEffect(() => {
    if (!show) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show]);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <button
        onClick={() => setShow((s) => !s)}
        className="text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-xs text-slate-300 leading-relaxed pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
