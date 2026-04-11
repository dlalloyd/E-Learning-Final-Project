/**
 * Post-Session Flow Component
 *
 * After a session completes, this handles:
 * 1. Study schedule generation (Features 1 & 4)
 * 2. Adaptive goal suggestion (Feature 9)
 * 3. Elaborative interrogation if applicable (Feature 6)
 * 4. Research consent prompt (if not yet given)
 * 5. SUS questionnaire (after 3+ sessions)
 */
'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Target, Award, ClipboardList,
  ChevronRight, CheckCircle2, X,
} from 'lucide-react';

interface Props {
  sessionId: string;
  onDismiss: () => void;
}

interface ScheduleResult {
  scheduled: number;
  nextReview?: string;
  kcIds?: string[];
}

interface GoalResult {
  goal: { targetValue: number; currentValue: number; achieved: boolean };
  suggestion?: string;
}

export default function PostSessionFlow({ sessionId, onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [goal, setGoal] = useState<GoalResult | null>(null);
  const [consentNeeded, setConsentNeeded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // Generate study schedule
        const schedRes = await fetch('/api/study-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (schedRes.ok) setSchedule(await schedRes.json());

        // Create/update goal
        const goalRes = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (goalRes.ok) setGoal(await goalRes.json());

        // Check research consent
        const consentRes = await fetch('/api/research');
        if (consentRes.ok) {
          const consentData = await consentRes.json();
          if (!consentData.consent) setConsentNeeded(true);
        }
      } catch (e) {
        console.error('PostSessionFlow init error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const steps = [
    // Step 0: Schedule summary
    schedule && schedule.scheduled > 0 && (
      <div key="schedule" className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Review Schedule Created</h3>
        </div>
        <p className="text-sm text-slate-300">
          {schedule.scheduled} topic{schedule.scheduled !== 1 ? 's' : ''} scheduled for spaced review.
          Your first review is due tomorrow.
        </p>
        <p className="text-xs text-slate-500">
          Retrieval practice at expanding intervals (1, 3, 7, 14, 30 days) produces 80% better
          long-term retention than re-reading (Roediger & Karpicke, 2006).
        </p>
      </div>
    ),

    // Step 1: Goal
    goal && goal.suggestion && (
      <div key="goal" className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Your Next Goal</h3>
        </div>
        <p className="text-sm text-slate-300">{goal.suggestion}</p>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (goal.goal.currentValue / goal.goal.targetValue) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          Specific, challenging goals improve performance by 20-25% (Locke & Latham, 2002).
        </p>
      </div>
    ),

    // Step 2: Research consent (if needed)
    consentNeeded && (
      <ResearchConsentCard key="consent" onComplete={() => {
        setConsentNeeded(false);
        setStep((s) => s + 1);
      }} />
    ),
  ].filter(Boolean);

  if (steps.length === 0) {
    // Nothing to show
    return null;
  }

  const currentStep = steps[step];
  const isLast = step >= steps.length - 1;

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-700'}`}
            />
          ))}
        </div>
        <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400">
          <X size={16} />
        </button>
      </div>

      {currentStep}

      <button
        onClick={() => isLast ? onDismiss() : setStep((s) => s + 1)}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
      >
        {isLast ? 'Done' : 'Next'}
        {!isLast && <ChevronRight size={14} />}
      </button>
    </div>
  );
}

// --- Research Consent Card ---

function ResearchConsentCard({ onComplete }: { onComplete: () => void }) {
  const [ageRange, setAgeRange] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConsent = async (consented: boolean) => {
    setSubmitting(true);
    await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentGiven: consented,
        ageRange: consented ? ageRange : null,
        priorGeoKnowledge: consented ? priorKnowledge : null,
      }),
    });
    setSubmitting(false);
    onComplete();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList size={18} className="text-violet-400" />
        <h3 className="text-base font-semibold text-white">Help with Research?</h3>
      </div>
      <p className="text-sm text-slate-300">
        This app is part of a University of Hull CS dissertation. Your anonymised learning
        data would help evaluate the adaptive tutoring system. Participation is voluntary
        and you can withdraw at any time.
      </p>

      <div className="space-y-2">
        <select
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        >
          <option value="">Age range (optional)</option>
          <option value="under-18">Under 18</option>
          <option value="18-24">18-24</option>
          <option value="25-34">25-34</option>
          <option value="35-44">35-44</option>
          <option value="45+">45+</option>
        </select>
        <select
          value={priorKnowledge}
          onChange={(e) => setPriorKnowledge(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        >
          <option value="">Prior geography knowledge (optional)</option>
          <option value="none">None</option>
          <option value="gcse">GCSE level</option>
          <option value="a-level">A-Level</option>
          <option value="degree">Degree level</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleConsent(true)}
          disabled={submitting}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 size={14} /> I Consent
        </button>
        <button
          onClick={() => handleConsent(false)}
          disabled={submitting}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-sm"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
