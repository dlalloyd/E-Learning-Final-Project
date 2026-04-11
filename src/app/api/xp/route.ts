/**
 * XP & Streak System API
 *
 * GET  - returns user's XP, level, streak, achievements
 * POST - awards XP for an action (called internally after answers, session complete, etc.)
 *
 * Streak logic: if user was active yesterday, increment streak.
 * If user was active today already, no change. Otherwise reset to 1.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';
import { XP_VALUES, levelFromXP, xpProgress, ACHIEVEMENTS } from '@/lib/achievements';

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isYesterday(d1: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d1, yesterday);
}

async function updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; streakBonusXp: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
  });

  if (!user) return { currentStreak: 0, longestStreak: 0, streakBonusXp: 0 };

  const now = new Date();
  let newStreak = user.currentStreak;
  let streakBonusXp = 0;

  if (user.lastActivityDate) {
    if (isSameDay(user.lastActivityDate, now)) {
      // Already active today, no streak change
      return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, streakBonusXp: 0 };
    } else if (isYesterday(user.lastActivityDate, now)) {
      // Consecutive day - increment streak
      newStreak = user.currentStreak + 1;
    } else {
      // Streak broken - reset to 1
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  // Check for streak milestone bonuses
  if (newStreak === 3) streakBonusXp = XP_VALUES.STREAK_BONUS_3;
  else if (newStreak === 7) streakBonusXp = XP_VALUES.STREAK_BONUS_7;
  else if (newStreak === 14) streakBonusXp = XP_VALUES.STREAK_BONUS_14;
  else if (newStreak === 30) streakBonusXp = XP_VALUES.STREAK_BONUS_30;

  const newLongest = Math.max(user.longestStreak, newStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: now,
    },
  });

  return { currentStreak: newStreak, longestStreak: newLongest, streakBonusXp };
}

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        totalXp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        badges: { include: { badge: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const progress = xpProgress(user.totalXp);
    const earnedBadgeIds = user.badges.map(b => b.badge.name);

    // Check which achievements are earned vs locked
    const achievements = ACHIEVEMENTS.map(a => ({
      ...a,
      earned: earnedBadgeIds.includes(a.id),
      earnedAt: user.badges.find(b => b.badge.name === a.id)?.earnedAt || null,
    }));

    // Get recent XP events
    const recentXp = await prisma.xPEvent.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      totalXp: user.totalXp,
      level: progress.level,
      currentLevelXp: progress.currentLevelXp,
      nextLevelXp: progress.nextLevelXp,
      levelProgress: progress.progress,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      achievements,
      recentXp,
    });
  } catch (error) {
    console.error('GET /api/xp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reason, sessionId, amount: customAmount } = await req.json();

    // Calculate XP amount based on reason
    let amount = customAmount || 0;
    if (!customAmount) {
      const xpMap: Record<string, number> = {
        correct_answer: XP_VALUES.CORRECT_ANSWER,
        correct_no_hints: XP_VALUES.CORRECT_NO_HINTS,
        correct_bloom_2: XP_VALUES.CORRECT_BLOOM_2,
        correct_bloom_3: XP_VALUES.CORRECT_BLOOM_3,
        mastery_achieved: XP_VALUES.MASTERY_ACHIEVED,
        session_complete: XP_VALUES.SESSION_COMPLETE,
        challenge_correct: XP_VALUES.CHALLENGE_CORRECT,
        daily_login: XP_VALUES.DAILY_LOGIN,
        first_session: XP_VALUES.FIRST_SESSION,
        map_fact_unlocked: XP_VALUES.MAP_FACT_UNLOCKED,
      };
      amount = xpMap[reason] || 10;
    }

    // Create XP event
    await prisma.xPEvent.create({
      data: {
        userId: auth.userId,
        amount,
        reason: reason || 'generic',
        sessionId: sessionId || null,
      },
    });

    // Update user totals
    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        totalXp: { increment: amount },
        level: levelFromXP((await prisma.user.findUnique({ where: { id: auth.userId }, select: { totalXp: true } }))!.totalXp + amount),
      },
    });

    // Update streak
    const streak = await updateStreak(auth.userId);

    // Award streak bonus XP if applicable
    if (streak.streakBonusXp > 0) {
      await prisma.xPEvent.create({
        data: {
          userId: auth.userId,
          amount: streak.streakBonusXp,
          reason: `streak_bonus_${streak.currentStreak}`,
          sessionId: sessionId || null,
        },
      });
      await prisma.user.update({
        where: { id: auth.userId },
        data: { totalXp: { increment: streak.streakBonusXp } },
      });
    }

    const progress = xpProgress(updated.totalXp + (streak.streakBonusXp || 0));

    return NextResponse.json({
      awarded: amount,
      streakBonus: streak.streakBonusXp,
      totalXp: updated.totalXp + (streak.streakBonusXp || 0),
      level: progress.level,
      levelProgress: progress.progress,
      streak: streak.currentStreak,
    });
  } catch (error) {
    console.error('POST /api/xp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
