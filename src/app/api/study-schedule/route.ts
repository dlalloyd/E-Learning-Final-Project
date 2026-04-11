/**
 * Study Schedule API - Spaced Repetition (Features 1 & 4)
 *
 * After each session, generates a retrieval practice schedule based on
 * Ebbinghaus forgetting curve intervals: 1d, 3d, 7d, 14d, 30d.
 * Roediger & Karpicke (2006) showed retrieval practice produces 80%
 * better long-term retention than re-reading.
 *
 * GET  - fetch pending reviews for user
 * POST - generate schedule from a completed session
 * PATCH - mark a review as completed or skipped
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

const INTERVALS = [1, 3, 7, 14, 30]; // days (expanding schedule)

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const pending = await prisma.studySchedule.findMany({
      where: {
        userId: auth.userId,
        completed: false,
        skipped: false,
        dueAt: { lte: now },
      },
      orderBy: { dueAt: 'asc' },
      take: 10,
    });

    const upcoming = await prisma.studySchedule.findMany({
      where: {
        userId: auth.userId,
        completed: false,
        skipped: false,
        dueAt: { gt: now },
      },
      orderBy: { dueAt: 'asc' },
      take: 5,
    });

    const completedCount = await prisma.studySchedule.count({
      where: { userId: auth.userId, completed: true },
    });

    return NextResponse.json({ pending, upcoming, completedCount });
  } catch (error) {
    console.error('GET /api/study-schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    // Find KCs that need review (mastery < 0.95)
    const masteries = await prisma.kCMastery.findMany({
      where: { sessionId },
    });

    const weakKCs = masteries.filter((m) => m.pLearned < 0.95);
    if (weakKCs.length === 0) {
      return NextResponse.json({ scheduled: 0, message: 'All KCs mastered - no review needed' });
    }

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schedules: any[] = [];

    for (const kc of weakKCs) {
      // Only schedule the first interval; subsequent ones created on completion
      const dueAt = new Date(now.getTime() + INTERVALS[0] * 24 * 60 * 60 * 1000);
      schedules.push({
        userId: auth.userId,
        sessionId,
        kcId: kc.kcId,
        dueAt,
        interval: INTERVALS[0],
      });
    }

    await prisma.studySchedule.createMany({ data: schedules });

    return NextResponse.json({
      scheduled: schedules.length,
      nextReview: schedules[0]?.dueAt,
      kcIds: weakKCs.map((k) => k.kcId),
    });
  } catch (error) {
    console.error('POST /api/study-schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { scheduleId, action } = await req.json();
    if (!scheduleId || !['complete', 'skip'].includes(action)) {
      return NextResponse.json({ error: 'scheduleId and action (complete|skip) required' }, { status: 400 });
    }

    const schedule = await prisma.studySchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.userId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (action === 'complete') {
      await prisma.studySchedule.update({
        where: { id: scheduleId },
        data: { completed: true, completedAt: new Date() },
      });

      // Schedule next interval if available
      const currentIdx = INTERVALS.indexOf(schedule.interval);
      if (currentIdx >= 0 && currentIdx < INTERVALS.length - 1) {
        const nextInterval = INTERVALS[currentIdx + 1];
        const nextDue = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
        await prisma.studySchedule.create({
          data: {
            userId: auth.userId,
            sessionId: schedule.sessionId,
            kcId: schedule.kcId,
            dueAt: nextDue,
            interval: nextInterval,
          },
        });
      }
    } else {
      await prisma.studySchedule.update({
        where: { id: scheduleId },
        data: { skipped: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/study-schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
