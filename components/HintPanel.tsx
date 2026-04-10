'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Hint {
  id: string;
  hintText: string;
  hintLevel: number;
  orderIndex: number;
}

interface HintPanelProps {
  questionId: string;
  sessionId: string;
  show: boolean;
  onHintRevealed?: (level: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HINT_LEVEL_LABELS: Record<number, string> = {
  1: 'Conceptual Hint',
  2: 'Procedural Hint',
  3: 'Worked Example',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HintPanel({ questionId, sessionId, show, onHintRevealed }: HintPanelProps) {
  const [hints, setHints] = useState<Hint[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  // Fetch hints when panel becomes visible or questionId changes
  useEffect(() => {
    if (!show || !questionId) return;

    let cancelled = false;

    async function fetchHints() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/questions/${questionId}/hints`);
        if (!res.ok) {
          throw new Error('Failed to fetch hints');
        }
        const data = await res.json();
        if (!cancelled) {
          setHints(data.hints ?? []);
          setRevealedCount(0);
          setViewedIds(new Set());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load hints');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHints();
    return () => { cancelled = true; };
  }, [show, questionId]);

  // Log analytics event when a hint is revealed
  const logHintEvent = useCallback(
    async (hint: Hint) => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'hint_requested',
            payload: {
              questionId,
              hintLevel: hint.hintLevel,
              hintId: hint.id,
            },
          }),
        });
      } catch {
        // Analytics failures are non-blocking
      }
    },
    [sessionId, questionId]
  );

  const revealNextHint = useCallback(() => {
    if (revealedCount >= hints.length) return;

    const nextHint = hints[revealedCount];
    const nextCount = revealedCount + 1;

    setRevealedCount(nextCount);
    setViewedIds((prev) => new Set(prev).add(nextHint.id));
    logHintEvent(nextHint);
    onHintRevealed?.(nextHint.hintLevel);
  }, [revealedCount, hints, logHintEvent, onHintRevealed]);

  // Don't render anything when hidden
  if (!show) return null;

  const remainingCount = Math.max(0, hints.length - revealedCount);
  const hasMore = revealedCount < hints.length;

  return (
    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Hints</h3>
        {hints.length > 0 && (
          <span className="text-xs text-slate-400">
            {remainingCount} hint{remainingCount !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
          <svg
            className="h-4 w-4 animate-spin text-indigo-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading hints...
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="py-2 text-sm text-red-400">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && hints.length === 0 && (
        <p className="py-2 text-sm text-slate-400">
          No hints available for this question.
        </p>
      )}

      {/* Revealed hints */}
      {!loading && hints.length > 0 && (
        <div className="space-y-3">
          {hints.slice(0, revealedCount).map((hint) => (
            <div
              key={hint.id}
              className="rounded-md border border-slate-600 bg-slate-900 p-3"
            >
              <div className="mb-1 text-xs font-medium text-indigo-400">
                {HINT_LEVEL_LABELS[hint.hintLevel] ?? `Level ${hint.hintLevel}`}
              </div>
              <p className="text-sm leading-relaxed text-slate-200">
                {hint.hintText}
              </p>
            </div>
          ))}

          {/* Reveal button */}
          {hasMore && (
            <div className="space-y-1">
              <button
                onClick={revealNextHint}
                className="w-full rounded-md border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-600/30 hover:text-indigo-200"
              >
                {revealedCount === 0 ? 'Show Hint' : 'Show Next Hint'}
              </button>
              <p className="text-center text-xs text-slate-500">
                Using hints reduces mastery credit for this question
              </p>
            </div>
          )}

          {/* All revealed */}
          {!hasMore && revealedCount > 0 && (
            <p className="pt-1 text-center text-xs text-slate-500">
              All hints revealed
            </p>
          )}
        </div>
      )}
    </div>
  );
}
