'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Brain, BarChart2, Clock } from 'lucide-react';

const SLIDES = [
  {
    icon: Brain,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10',
    title: 'It adapts to you',
    body: 'GeoMentor tracks what you know in real time. Every answer moves your ability estimate — questions get harder or easier to keep you in the learning zone, not bored and not overwhelmed.',
  },
  {
    icon: BarChart2,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    title: '13 topics, one system',
    body: 'The system covers 13 Geography knowledge areas from UK capitals to climate change. It maps your mastery of each one separately, so you never waste time on things you already know.',
  },
  {
    icon: Clock,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'About 10–15 minutes',
    body: 'A session is 15 questions. Answer honestly — confidence rating included. The more sessions you do, the more accurately the system models your knowledge.',
  },
];

interface OnboardingModalProps {
  onDone: () => void;
}

export default function OnboardingModal({ onDone }: OnboardingModalProps) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      try { localStorage.setItem('gm_onboarding_seen', 'true'); } catch { /* ignore */ }
      onDone();
    } else {
      setSlide((s) => s + 1);
    }
  };

  const current = SLIDES[slide];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      <motion.div
        key={slide}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm bg-[#0d1527] ring-1 ring-white/[0.08] rounded-2xl p-7 space-y-6"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${current.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${current.iconColor}`} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-white font-bold text-xl leading-tight">{current.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
        >
          {isLast ? "Let's start" : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
