import { NextResponse } from 'next/server';
import { getAuthFromCookie } from '@/lib/auth/jwt';
import prisma from '@/lib/db/client';

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ user: null });
    }

    const [dbUser, incompleteSession] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { studyCondition: true },
      }),
      prisma.session.findFirst({
        where: { userId: auth.userId, completedAt: null },
        orderBy: { startedAt: 'desc' },
        select: { id: true, condition: true, theta: true, thetaSd: true },
      }),
    ]);

    return NextResponse.json({
      user: { id: auth.userId, email: auth.email, name: auth.name, role: auth.role, studyCondition: dbUser?.studyCondition ?? 'adaptive' },
      incompleteSession: incompleteSession || null,
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
