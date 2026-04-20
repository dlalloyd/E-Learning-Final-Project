import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

const TEST_EMAILS = [
  'test@elearning.dev',
  'asds@email.com',
  '123@email.com',
  '1223@email.com',
];

const INITIAL_THETA = -0.780;

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch users, sessions, SUS separately to avoid schema relation gaps
    const [users, sessions, allSUS] = await Promise.all([
      prisma.user.findMany({
        where: {
          email: {
            notIn: [...TEST_EMAILS],
            not: { endsWith: '@example.com' },
          },
        },
        select: { id: true, name: true, email: true, createdAt: true },
      }),

      prisma.session.findMany({
        where: {
          user: {
            email: {
              notIn: [...TEST_EMAILS],
              not: { endsWith: '@example.com' },
            },
          },
        },
        include: {
          interactions: { select: { isCorrect: true, responseTimeMs: true } },
          kcMasteries: { select: { kcId: true, pLearned: true, masteredAt: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),

      prisma.sUSResponse.findMany({
        where: { susScore: { not: null } },
        select: { userId: true, susScore: true },
      }),
    ]);

    // Map userId -> SUS score (latest)
    const susMap = new Map<string, number>();
    allSUS.forEach((r) => {
      if (r.susScore !== null && !susMap.has(r.userId)) {
        susMap.set(r.userId, r.susScore);
      }
    });

    // Map userId -> user info
    const userMap = new Map(users.map((u) => [u.id, u]));

    const participants = sessions.map((s) => {
      const user = userMap.get(s.userId);
      const total = s.interactions.length;
      const correct = s.interactions.filter((i) => i.isCorrect).length;
      const avgResponseMs =
        total > 0
          ? s.interactions.reduce((sum, i) => sum + i.responseTimeMs, 0) / total
          : 0;
      const durationMins =
        s.completedAt && s.startedAt
          ? Math.round(((s.completedAt.getTime() - s.startedAt.getTime()) / 60000) * 10) / 10
          : null;

      return {
        name: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        joined: user?.createdAt.toISOString().split('T')[0] ?? '',
        session_id: s.id,
        condition: s.condition,
        started: s.startedAt.toISOString(),
        completed: s.completedAt?.toISOString() ?? null,
        duration_mins: durationMins,
        initial_theta: INITIAL_THETA,
        final_theta: Math.round(s.theta * 1000) / 1000,
        total_questions: total,
        correct,
        accuracy_pct: total > 0 ? Math.round((correct / total) * 1000) / 10 : null,
        avg_response_secs: total > 0 ? Math.round(avgResponseMs / 100) / 10 : null,
        sus_score: susMap.get(s.userId) ?? null,
      };
    });

    const completedSessions = participants.filter((p) => p.completed !== null);
    const thetaGains = completedSessions.map((p) => p.final_theta - INITIAL_THETA);
    const avgThetaGain =
      thetaGains.length > 0
        ? thetaGains.reduce((a, b) => a + b, 0) / thetaGains.length
        : 0;

    const susScores = allSUS.map((r) => r.susScore as number);
    const susSummary =
      susScores.length > 0
        ? {
            count: susScores.length,
            avg_score: Math.round((susScores.reduce((a, b) => a + b, 0) / susScores.length) * 10) / 10,
            min_score: Math.min(...susScores),
            max_score: Math.max(...susScores),
          }
        : { count: 0, avg_score: 0, min_score: 0, max_score: 0 };

    // KC mastery aggregated across all real participants
    const kcMap = new Map<string, { total: number; sumLearned: number; mastered: number }>();
    sessions.forEach((s) => {
      s.kcMasteries.forEach((m) => {
        const existing = kcMap.get(m.kcId) ?? { total: 0, sumLearned: 0, mastered: 0 };
        kcMap.set(m.kcId, {
          total: existing.total + 1,
          sumLearned: existing.sumLearned + m.pLearned,
          mastered: existing.mastered + (m.masteredAt ? 1 : 0),
        });
      });
    });

    const kcMasteries = Array.from(kcMap.entries())
      .map(([kc_id, v]) => ({
        kc_id,
        avg_p_learned: Math.round((v.sumLearned / v.total) * 1000) / 1000,
        mastered_count: v.mastered,
        total_count: v.total,
      }))
      .sort((a, b) => b.avg_p_learned - a.avg_p_learned);

    return NextResponse.json({
      participants,
      summary: {
        total_signups: users.length,
        completed_sessions: completedSessions.length,
        avg_theta_gain: Math.round(avgThetaGain * 1000) / 1000,
        sus: susSummary,
      },
      kc_masteries: kcMasteries,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
