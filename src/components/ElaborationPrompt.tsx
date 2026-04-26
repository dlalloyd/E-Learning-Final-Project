/**
 * Elaborative Interrogation Prompt (Feature 6)
 * Dunlosky et al. (2013) - appears after correct answers (~20% chance)
 * to deepen understanding via self-explanation.
 */
'use client';

import { useState, useRef } from 'react';
import { Lightbulb, Send, X } from 'lucide-react';

interface Props {
  sessionId: string;
  questionId: string;
  kcId: string;
  bloomLevel: number;
  onComplete: () => void;
  onSkip: () => void;
}

const PROMPTS: Record<number, string[]> = {
  1: [
    'How would you remember this fact?',
    'What makes this different from similar items?',
    'Can you connect this to something you already know?',
  ],
  2: [
    'Why is this the correct answer?',
    'What would happen if the opposite were true?',
    'How does this relate to the other concepts you have learned?',
  ],
  3: [
    'How would you apply this knowledge to a new situation?',
    'What assumptions did you make when answering?',
    'Could this answer change under different conditions? Why?',
  ],
};

export default function ElaborationPrompt({
  sessionId, questionId, kcId, bloomLevel, onComplete, onSkip,
}: Props) {
  const prompts = PROMPTS[bloomLevel] || PROMPTS[1];
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTime = useRef(Date.now());

  const handleSubmit = async () => {
    if (!response.trim() || submitting) return;
    setSubmitting(true);

    await fetch('/api/elaboration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionId,
        kcId,
        prompt,
        response: response.trim(),
        responseTimeMs: Date.now() - startTime.current,
      }),
    }).catch(console.error);

    setSubmitted(true);
    setSubmitting(false);
    setTimeout(onComplete, 1200);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-4 text-center">
        <Lightbulb size={20} className="text-emerald-400 mx-auto mb-1" />
        <p className="text-sm text-emerald-300">Great reflection! Self-explanation deepens learning.</p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-950/30 border border-indigo-700/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-indigo-300">Quick Reflection</span>
        </div>
        <button onClick={onSkip} className="text-slate-600 hover:text-slate-400" aria-label="Skip reflection">
          <X size={14} />
        </button>
      </div>
      <p className="text-sm text-slate-200">{prompt}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your explanation here..."
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!response.trim() || submitting}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
      >
        <Send size={14} />
        {submitting ? 'Saving...' : 'Submit'}
      </button>
      <p className="text-[10px] text-slate-600 text-center">
        Self-explanation improves understanding (Dunlosky et al., 2013)
      </p>
    </div>
  );
}
