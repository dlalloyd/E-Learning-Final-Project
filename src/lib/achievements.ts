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

// --- Level Thresholds (logarithmic curve) ---

export function levelFromXP(xp: number): number {
  // Each level requires ~30% more XP than the last
  // Level 1: 0, Level 2: 100, Level 3: 230, Level 4: 400, ...
  if (xp <= 0) return 1;
  return Math.floor(1 + Math.log(1 + xp / 100) / Math.log(1.3));
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * (Math.pow(1.3, level - 1) - 1));
}

export function xpProgress(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } {
  const level = levelFromXP(xp);
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? (xp - currentThreshold) / range : 0;
  return { level, currentLevelXp: xp - currentThreshold, nextLevelXp: range, progress: Math.min(progress, 1) };
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
