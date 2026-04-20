import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { leaderboardOptIn: true },
    });

    return NextResponse.json({ leaderboardOptIn: user?.leaderboardOptIn ?? false });
  } catch (error) {
    console.error('Leaderboard consent GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { optIn } = await req.json() as { optIn: boolean };

    await prisma.user.update({
      where: { id: auth.userId },
      data: { leaderboardOptIn: optIn },
    });

    return NextResponse.json({ ok: true, leaderboardOptIn: optIn });
  } catch (error) {
    console.error('Leaderboard consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
