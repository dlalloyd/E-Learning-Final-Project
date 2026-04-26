'use client';

/**
 * Learner Profile Component - Psychometric-style insights
 *
 * Generates a personalised learning profile similar to personality
 * assessment tools but grounded in educational measurement theory.
 * The more sessions the learner completes, the more accurate and
 * detailed the profile becomes - and we tell them this explicitly
 * to encourage return visits.
 */

import { useState, useEffect } from 'react';
import { X, User, Brain, Target, Zap, TrendingUp, Flame, Shield, ChevronRight, BarChart3, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileTrait {
  label: string;
  value: number;
  description: string;
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
}

interface ProfileData {
  userName: string;
  memberSince: string;
  profileAccuracy: number;
  profileAccuracyLabel: string;
  archetype: { primary: string; secondary: string; description: string };
  traits: ProfileTrait[];
  stats: {
    totalSessions: number;
    totalQuestions: number;
    totalCorrect: number;
    accuracy: number;
    avgResponseTimeMs: number;
    avgSessionMinutes: number;
    currentTheta: number;
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    kcsMastered: number;
    totalKCs: number;
  };
  strengths: Array<{ kcId: string; name: string; pLearned: number; bloom: number }>;
  weaknesses: Array<{ kcId: string; name: string; pLearned: number; bloom: number }>;
  thetaHistory: Array<{ sessionIndex: number; theta: number; date: string }>;
  impulsivityScore: number;
  avgCognitiveLoad: number;
}

const TRAIT_ICONS: Record<string, typeof Brain> = {
  'Accuracy': Target,
  'Response Speed': Zap,
  'Self-Regulation': Shield,
  'Persistence': Flame,
  'Growth Rate': TrendingUp,
  'Depth of Processing': Brain,
};

const CONFIDENCE_LABELS = {
  low: { text: 'Early estimate', colour: 'text-amber-400', bg: 'bg-amber-500/10' },
  medium: { text: 'Developing', colour: 'text-blue-400', bg: 'bg-blue-500/10' },
  high: { text: 'Reliable', colour: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

interface LearnerProfileProps {
  onClose: () => void;
}

export default function LearnerProfile({ onClose }: LearnerProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/learner-profile')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Analysing your learning patterns...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <p className="text-red-400 text-sm">{error || 'Could not load profile'}</p>
        <button onClick={onClose} className="mt-3 text-slate-400 text-xs hover:text-white">Close</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 sm:px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-8 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-2 left-8 w-24 h-24 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{profile.userName}</h3>
                <p className="text-violet-200 text-xs">Level {profile.stats.level} - {profile.stats.totalXp} XP</p>
              </div>
            </div>
            <p className="text-violet-200 text-sm font-medium mt-2">{profile.archetype.primary}</p>
            <p className="text-violet-300/70 text-xs mt-0.5">Secondary: {profile.archetype.secondary}</p>
          </div>
          <button onClick={onClose} className="text-violet-200 hover:text-white" aria-label="Close profile">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Accuracy Meter */}
        <div className="mt-4 relative">
          <div className="flex justify-between text-xs text-violet-200 mb-1">
            <span>Profile Accuracy</span>
            <span>{profile.profileAccuracy}%</span>
          </div>
          <div className="h-2 bg-violet-800/50 rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.profileAccuracy}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-violet-300 to-white rounded-full"
            />
          </div>
          <p className="text-violet-300/60 text-[10px] mt-1">{profile.profileAccuracyLabel}</p>
        </div>
      </div>

      {/* Archetype Description */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-800">
        <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-3">
          <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-300 text-sm leading-relaxed">{profile.archetype.description}</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
        {[
          { label: 'Sessions', value: profile.stats.totalSessions },
          { label: 'Accuracy', value: `${profile.stats.accuracy}%` },
          { label: 'Streak', value: `${profile.stats.currentStreak}d` },
          { label: 'Mastered', value: `${profile.stats.kcsMastered}/${profile.stats.totalKCs}` },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 p-3 text-center">
            <div className="text-white font-bold text-lg">{stat.value}</div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Trait Cards */}
      <div className="px-4 sm:px-6 py-4 space-y-2">
        <h4 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-3">Learning Traits</h4>
        {profile.traits.map(trait => {
          const Icon = TRAIT_ICONS[trait.label] || BarChart3;
          const conf = CONFIDENCE_LABELS[trait.confidence];
          const isExpanded = expandedTrait === trait.label;

          return (
            <button
              key={trait.label}
              onClick={() => setExpandedTrait(isExpanded ? null : trait.label)}
              className="w-full text-left"
            >
              <div className={`rounded-xl border transition-all ${
                isExpanded ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
              } p-3`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-white text-sm font-medium flex-1">{trait.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${conf.bg} ${conf.colour}`}>
                    {conf.text}
                  </span>
                  <span className="text-white font-bold text-sm w-8 text-right">{trait.value}</span>
                  <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(trait.value, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      trait.value >= 70 ? 'bg-emerald-500' : trait.value >= 40 ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-slate-400 text-xs mt-3 leading-relaxed">{trait.description}</p>
                      <p className="text-slate-600 text-[10px] mt-1">Based on {trait.dataPoints} data points</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          );
        })}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="px-4 sm:px-6 py-4 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-emerald-400 text-xs font-mono uppercase tracking-widest mb-2">Strengths</h4>
            {profile.strengths.map(s => (
              <div key={s.kcId} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-slate-300 text-xs flex-1 truncate">{s.name}</span>
                <span className="text-emerald-400 text-xs font-mono">{Math.round(s.pLearned * 100)}%</span>
              </div>
            ))}
            {profile.strengths.length === 0 && (
              <p className="text-slate-600 text-xs">Complete more sessions to discover</p>
            )}
          </div>
          <div>
            <h4 className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-2">Growth Areas</h4>
            {profile.weaknesses.map(w => (
              <div key={w.kcId} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span className="text-slate-300 text-xs flex-1 truncate">{w.name}</span>
                <span className="text-amber-400 text-xs font-mono">{Math.round(w.pLearned * 100)}%</span>
              </div>
            ))}
            {profile.weaknesses.length === 0 && (
              <p className="text-slate-600 text-xs">Complete more sessions to discover</p>
            )}
          </div>
        </div>
      </div>

      {/* Theta Trajectory */}
      {profile.thetaHistory.length > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-slate-800">
          <h4 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-3">Ability Growth</h4>
          <div className="h-20 flex items-end gap-1">
            {profile.thetaHistory.map((point, i) => {
              const normalised = ((point.theta + 3) / 6) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, normalised)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`w-full rounded-t ${
                      i === profile.thetaHistory.length - 1 ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  />
                  <span className="text-[8px] text-slate-600">S{point.sessionIndex}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Call to action */}
      <div className="px-4 sm:px-6 py-4 border-t border-slate-800 bg-slate-800/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-400 text-xs leading-relaxed">
            {profile.profileAccuracy < 50
              ? 'Your profile is still forming. Each session you complete adds new data points, making your insights more accurate and personalised. Come back for more sessions to unlock deeper analysis.'
              : profile.profileAccuracy < 80
              ? 'Your profile is becoming more reliable with each session. Continue learning to unlock the full depth of your personalised insights.'
              : 'Your learning profile is well-established and highly accurate. Keep your streak going to maintain and improve your skills.'}
          </p>
        </div>
      </div>
    </div>
  );
}
