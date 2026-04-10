'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_DONE_KEY = 'gm_tour_done';

interface TourStep {
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to GeoMentor',
    body: 'GeoMentor is an intelligent tutoring system that adapts to your ability in real time. Every question is selected to maximise your learning.',
  },
  {
    title: 'Adaptive Engine',
    body: 'The system estimates your ability using Item Response Theory (IRT) and tracks your knowledge of each concept with Bayesian Knowledge Tracing. Questions get harder as you improve.',
  },
  {
    title: 'Two Learning Paths',
    body: 'Choose "Learn First" to study the material before being assessed, or take a pre-test to let the engine calibrate your starting level. Both paths lead to a personalised session.',
  },
  {
    title: 'Hints Cost Mastery',
    body: 'Hints are available during each question. Using them is encouraged when you are stuck, but each hint level reduces the mastery credit you earn. Use them wisely.',
  },
  {
    title: 'Session Resume',
    body: 'Your progress is saved automatically. If you leave and come back, you can pick up right where you left off. Your learning journey never resets.',
  },
];

export default function FirstVisitTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(TOUR_DONE_KEY) !== '1') {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_DONE_KEY, '1');
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-indigo-400 font-mono mb-1">
                Step {step + 1} of {STEPS.length}
              </p>
              <h3 className="text-lg font-bold text-white">{current.title}</h3>
            </div>
            <button
              onClick={dismiss}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {current.body}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-indigo-500' : i < step ? 'bg-indigo-800' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                step === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
              {step < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
