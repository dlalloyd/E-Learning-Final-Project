import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Top 10 by best theta gain in a single session (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: {
        completedAt: { not: null, gte: since },
        user: { role: { not: 'admin' } },
      },
      select: {
        userId: true,
        theta: true,
        user: { select: { name: true } },
      },
      orderBy: { theta: 'desc' },
    });

    // Best session theta per user, anonymised to first name + initial
    const bestPerUser = new Map<string, { displayName: string; theta: number; isYou: boolean }>();
    const INITIAL_THETA = -0.780;

    for (const s of sessions) {
      const existing = bestPerUser.get(s.userId);
      if (!existing || s.theta > existing.theta) {
        const parts = s.user.name.trim().split(' ');
        const displayName = parts.length > 1
          ? `${parts[0]} ${parts[parts.length - 1][0]}.`
          : parts[0];
        bestPerUser.set(s.userId, {
          displayName,
          theta: Math.round(s.theta * 1000) / 1000,
          isYou: s.userId === auth.userId,
        });
      }
    }

    const entries = Array.from(bestPerUser.values())
      .map((e) => ({ ...e, gain: Math.round((e.theta - INITIAL_THETA) * 1000) / 1000 }))
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 10);

    return NextResponse.json({ entries, since: since.toISOString() });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
