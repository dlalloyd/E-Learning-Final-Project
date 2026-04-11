/**
 * System Usability Scale (SUS) Questionnaire - Brooke (1996)
 * 10-item questionnaire, each rated 1-5 (Strongly Disagree to Strongly Agree).
 * Industry standard for usability evaluation.
 */
'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardList } from 'lucide-react';

const SUS_ITEMS = [
  'I think I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think I would need the support of a technical person to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.',
];

const LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

interface Props {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

export default function SUSQuestionnaire({ onComplete, onSkip }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ susScore: number; grade: string } | null>(null);

  const allAnswered = SUS_ITEMS.every((_, i) => answers[i] !== undefined);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);

    const body: Record<string, number> = {};
    for (let i = 0; i < 10; i++) body[`q${i + 1}`] = answers[i];

    try {
      const res = await fetch('/api/sus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setTimeout(() => onComplete(data.susScore), 2000);
      }
    } catch (e) {
      console.error('SUS submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 text-center space-y-3">
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Thank you!</h3>
        <p className="text-sm text-slate-300">
          Your usability score: <span className="font-mono font-bold text-indigo-400">{result.susScore}</span>/100
          (Grade: {result.grade})
        </p>
        <p className="text-xs text-slate-500">This feedback helps improve the system for future learners.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-violet-400" />
          <h3 className="text-base font-semibold text-white">Quick Usability Survey</h3>
        </div>
        <button onClick={onSkip} className="text-xs text-slate-500 hover:text-slate-300">Skip</button>
      </div>
      <p className="text-xs text-slate-400">Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).</p>

      <div className="space-y-4">
        {SUS_ITEMS.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-sm text-slate-300">
              <span className="text-slate-500 font-mono mr-1.5">{idx + 1}.</span>
              {item}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setAnswers((prev) => ({ ...prev, [idx]: val }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    answers[idx] === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 px-1">
              <span>{LABELS[0]}</span>
              <span>{LABELS[4]}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl text-sm transition-all"
      >
        {submitting ? 'Submitting...' : `Submit (${Object.keys(answers).length}/10 answered)`}
      </button>
    </div>
  );
}
