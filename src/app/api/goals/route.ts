/**
 * Adaptive Goal Setting API (Feature 9)
 *
 * Locke & Latham (2002) goal-setting theory: specific, challenging but
 * attainable goals improve performance 20-25% vs "do your best".
 *
 * After a session, the system suggests a personalised goal based on
 * current mastery. Goals are checked and updated after each session.
 *
 * GET  - fetch active goals for user
 * POST - create/suggest a new goal
 * PATCH - update goal progress
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goals = await prisma.learnerGoal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await req.json();

    // Count how many KCs the user has mastered across all sessions
    const masteredKCs = await prisma.kCMastery.findMany({
      where: {
        session: { userId: auth.userId },
        pLearned: { gte: 0.95 },
      },
      distinct: ['kcId'],
    });

    const totalKCs = 13; // Total KCs in the system
    const currentMastered = masteredKCs.length;

    // Don't create if already have an active unachieved goal
    const existing = await prisma.learnerGoal.findFirst({
      where: { userId: auth.userId, achieved: false, goalType: 'mastery_count' },
    });
    if (existing) {
      // Update current value
      await prisma.learnerGoal.update({
        where: { id: existing.id },
        data: {
          currentValue: currentMastered,
          achieved: currentMastered >= existing.targetValue,
          achievedAt: currentMastered >= existing.targetValue ? new Date() : null,
        },
      });
      return NextResponse.json({
        goal: { ...existing, currentValue: currentMastered },
        updated: true,
      });
    }

    // Suggest a goal: current + 2-3 KCs (challenging but attainable)
    const increment = currentMastered < 5 ? 3 : currentMastered < 10 ? 2 : 1;
    const target = Math.min(currentMastered + increment, totalKCs);

    const goal = await prisma.learnerGoal.create({
      data: {
        userId: auth.userId,
        goalType: 'mastery_count',
        targetValue: target,
        currentValue: currentMastered,
      },
    });

    return NextResponse.json({
      goal,
      suggestion: `You've mastered ${currentMastered} of ${totalKCs} topics. Can you reach ${target} by your next session?`,
    });
  } catch (error) {
    console.error('POST /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
