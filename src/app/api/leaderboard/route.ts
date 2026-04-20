import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await prisma.user.findMany({
      where: {
        leaderboardOptIn: true,
        role: { not: 'admin' },
        totalXp: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        totalXp: true,
        level: true,
        currentStreak: true,
      },
      orderBy: { totalXp: 'desc' },
      take: 10,
    });

    const entries = users.map((u) => {
      const parts = u.name.trim().split(' ');
      const displayName = parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : parts[0];
      return {
        displayName,
        xp: u.totalXp,
        level: u.level,
        streak: u.currentStreak,
        isYou: u.id === auth.userId,
      };
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
