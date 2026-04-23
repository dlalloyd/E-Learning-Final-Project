/**
 * Achievement Definitions & XP System
 *
 * Grounded in Self-Determination Theory (Deci & Ryan, 2000):
 * - Competence: mastery badges, XP from correct answers
 * - Autonomy: choice of learning path, self-directed goals
 * - Relatedness: peer comparison (existing), achievement sharing
 *
 * Variable ratio reinforcement (Skinner): random bonus XP events
 * Loss aversion (Kahneman & Tversky, 1979): streak system
 */

// --- XP Constants ---

export const XP_VALUES = {
  CORRECT_ANSWER: 10,
  CORRECT_NO_HINTS: 15,     // bonus for unassisted
  CORRECT_BLOOM_2: 20,      // harder questions worth more
  CORRECT_BLOOM_3: 30,
  MASTERY_ACHIEVED: 50,     // mastering a KC
  SESSION_COMPLETE: 25,
  STREAK_BONUS_3: 15,       // 3-day streak
  STREAK_BONUS_7: 40,       // 7-day streak
  STREAK_BONUS_14: 100,     // 14-day streak
  STREAK_BONUS_30: 250,     // 30-day streak
  CHALLENGE_CORRECT: 35,    // challenge question correct
  DAILY_LOGIN: 5,
  FIRST_SESSION: 50,
  MAP_FACT_UNLOCKED: 5,     // unlocking a fun fact on map
} as const;

// --- Level Thresholds (dual-gate: XP + KCs mastered) ---

const LEVEL_TABLE: { level: number; xp: number; kcs: number }[] = [
  { level: 1,  xp: 0,    kcs: 0  },
  { level: 2,  xp: 100,  kcs: 0  },
  { level: 3,  xp: 250,  kcs: 1  },
  { level: 4,  xp: 450,  kcs: 2  },
  { level: 5,  xp: 700,  kcs: 3  },
  { level: 6,  xp: 1000, kcs: 4  },
  { level: 7,  xp: 1400, kcs: 5  },
  { level: 8,  xp: 1900, kcs: 6  },
  { level: 9,  xp: 2500, kcs: 8  },
  { level: 10, xp: 3300, kcs: 9  },
  { level: 11, xp: 4300, kcs: 10 },
  { level: 12, xp: 5500, kcs: 11 },
  { level: 13, xp: 7000, kcs: 12 },
  { level: 14, xp: 9000, kcs: 13 },
];

export function levelFromXPAndMastery(xp: number, kcsMastered: number): number {
  let reached = 1;
  for (const row of LEVEL_TABLE) {
    if (xp >= row.xp && kcsMastered >= row.kcs) reached = row.level;
  }
  return reached;
}

// Kept for backward-compat — prefer levelFromXPAndMastery
export function levelFromXP(xp: number): number {
  return levelFromXPAndMastery(xp, 99);
}

export function xpForLevel(level: number): number {
  return LEVEL_TABLE.find(r => r.level === level)?.xp ?? 0;
}

export function xpProgress(
  xp: number,
  kcsMastered = 99,
): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number; kcGated: boolean } {
  const level = levelFromXPAndMastery(xp, kcsMastered);
  const currentThreshold = xpForLevel(level);
  const nextRow = LEVEL_TABLE.find(r => r.level === level + 1);
  const nextThreshold = nextRow?.xp ?? currentThreshold;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? (xp - currentThreshold) / range : 1;
  // kcGated = user has enough XP for next level but not enough KCs
  const kcGated = nextRow !== undefined && xp >= nextRow.xp && kcsMastered < nextRow.kcs;
  return { level, currentLevelXp: xp - currentThreshold, nextLevelXp: range, progress: Math.min(progress, 1), kcGated };
}

// --- Achievement Definitions ---

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;     // lucide icon name
  criteria: string; // machine-readable criteria
  category: 'mastery' | 'streak' | 'exploration' | 'challenge' | 'milestone';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Mastery
  { id: 'first_mastery', name: 'First Steps', description: 'Master your first Knowledge Component', icon: 'Sparkles', criteria: 'mastery_count>=1', category: 'mastery' },
  { id: 'half_mastery', name: 'Halfway There', description: 'Master half of all Knowledge Components', icon: 'Target', criteria: 'mastery_count>=7', category: 'mastery' },
  { id: 'full_mastery', name: 'Geography Guru', description: 'Master all 13 Knowledge Components', icon: 'Crown', criteria: 'mastery_count>=13', category: 'mastery' },
  { id: 'bloom_2_ace', name: 'Deep Thinker', description: 'Answer 10 Bloom Level 2 questions correctly', icon: 'Brain', criteria: 'bloom2_correct>=10', category: 'mastery' },
  { id: 'bloom_3_ace', name: 'Applied Genius', description: 'Answer 5 Bloom Level 3 questions correctly', icon: 'Lightbulb', criteria: 'bloom3_correct>=5', category: 'mastery' },

  // Streaks
  { id: 'streak_3', name: 'Getting Started', description: 'Maintain a 3-day learning streak', icon: 'Flame', criteria: 'streak>=3', category: 'streak' },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintain a 7-day learning streak', icon: 'Flame', criteria: 'streak>=7', category: 'streak' },
  { id: 'streak_14', name: 'Fortnight Focus', description: 'Maintain a 14-day learning streak', icon: 'Flame', criteria: 'streak>=14', category: 'streak' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day learning streak', icon: 'Flame', criteria: 'streak>=30', category: 'streak' },

  // Exploration
  { id: 'map_explorer', name: 'Map Explorer', description: 'Unlock 5 fun facts on the interactive map', icon: 'Map', criteria: 'facts_unlocked>=5', category: 'exploration' },
  { id: 'all_parks', name: 'Park Ranger', description: 'Learn about all 15 UK National Parks', icon: 'Trees', criteria: 'parks_explored>=15', category: 'exploration' },
  { id: 'river_runner', name: 'River Runner', description: 'Explore all major UK rivers on the map', icon: 'Waves', criteria: 'rivers_explored>=8', category: 'exploration' },

  // Challenge
  { id: 'first_challenge', name: 'Challenge Accepted', description: 'Complete your first challenge question', icon: 'Swords', criteria: 'challenges_completed>=1', category: 'challenge' },
  { id: 'perfect_session', name: 'Flawless', description: 'Complete a session with 100% accuracy', icon: 'Trophy', criteria: 'perfect_session>=1', category: 'challenge' },
  { id: 'speed_demon', name: 'Quick Thinker', description: 'Answer 5 questions correctly in under 8 seconds each', icon: 'Zap', criteria: 'fast_correct>=5', category: 'challenge' },

  // Milestones
  { id: 'sessions_5', name: 'Regular', description: 'Complete 5 learning sessions', icon: 'Calendar', criteria: 'sessions_completed>=5', category: 'milestone' },
  { id: 'sessions_10', name: 'Dedicated', description: 'Complete 10 learning sessions', icon: 'Medal', criteria: 'sessions_completed>=10', category: 'milestone' },
  { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: 'Star', criteria: 'level>=5', category: 'milestone' },
  { id: 'level_10', name: 'Veteran', description: 'Reach Level 10', icon: 'Award', criteria: 'level>=10', category: 'milestone' },
  { id: 'xp_1000', name: 'XP Hunter', description: 'Earn 1,000 total XP', icon: 'Gem', criteria: 'total_xp>=1000', category: 'milestone' },
];
