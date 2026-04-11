/**
 * Peer Comparison API (Feature 8)
 * Festinger (1954) social comparison theory - anonymised percentile ranks.
 * Framed positively (growth-focused, not ranking).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // All completed sessions grouped by user
    const allSessions = await prisma.session.findMany({
      where: { completedAt: { not: null } },
      select: { userId: true, theta: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    // Latest theta per user
    const userThetas = new Map<string, number>();
    for (const s of allSessions) {
      if (!userThetas.has(s.userId)) userThetas.set(s.userId, s.theta);
    }

    const allThetas = Array.from(userThetas.values()).sort((a, b) => a - b);
    const myTheta = userThetas.get(auth.userId);
    const totalLearners = allThetas.length;

    if (myTheta === undefined || totalLearners < 2) {
      return NextResponse.json({
        available: false,
        message: 'Not enough data yet for comparison',
      });
    }

    // Percentile rank
    const belowMe = allThetas.filter((t) => t < myTheta).length;
    const percentile = Math.round((belowMe / totalLearners) * 100);

    // Cohort stats
    const mean = allThetas.reduce((a, b) => a + b, 0) / totalLearners;
    const median = allThetas[Math.floor(totalLearners / 2)];

    // KC mastery comparison
    const allMasteries = await prisma.kCMastery.findMany({
      where: { pLearned: { gte: 0.95 } },
      select: { session: { select: { userId: true } }, kcId: true },
    });

    const userMasteredKCs = new Map<string, Set<string>>();
    for (const m of allMasteries) {
      const uid = m.session.userId;
      if (!userMasteredKCs.has(uid)) userMasteredKCs.set(uid, new Set());
      userMasteredKCs.get(uid)!.add(m.kcId);
    }

    const myMastered = userMasteredKCs.get(auth.userId)?.size ?? 0;
    const allMasteredCounts = Array.from(userMasteredKCs.values()).map((s) => s.size).sort((a, b) => a - b);
    const masteryPercentile = allMasteredCounts.length > 1
      ? Math.round((allMasteredCounts.filter((c) => c < myMastered).length / allMasteredCounts.length) * 100)
      : 50;

    return NextResponse.json({
      available: true,
      totalLearners,
      you: {
        theta: Math.round(myTheta * 100) / 100,
        percentile,
        masteredKCs: myMastered,
        masteryPercentile,
      },
      cohort: {
        meanTheta: Math.round(mean * 100) / 100,
        medianTheta: Math.round(median * 100) / 100,
        avgMasteredKCs: allMasteredCounts.length > 0
          ? Math.round((allMasteredCounts.reduce((a, b) => a + b, 0) / allMasteredCounts.length) * 10) / 10
          : 0,
      },
    });
  } catch (error) {
    console.error('GET /api/peer-stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
