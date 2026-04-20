import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

export async function GET() {
  const auth = getAuthFromCookie();
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [participants, susSummary, kcMasteries] = await Promise.all([
    prisma.$queryRaw<Array<{
      name: string;
      email: string;
      joined: Date;
      session_id: string;
      condition: string;
      started: Date;
      completed: Date | null;
      duration_mins: number | null;
      initial_theta: number;
      final_theta: number;
      total_questions: number;
      correct: number;
      accuracy_pct: number | null;
      avg_response_secs: number | null;
      sus_score: number | null;
    }>>`
      SELECT
        u.name,
        u.email,
        u."createdAt" AS joined,
        s.id AS session_id,
        s.condition,
        s."startedAt" AS started,
        s."completedAt" AS completed,
        ROUND(EXTRACT(EPOCH FROM (s."completedAt" - s."startedAt")) / 60, 1) AS duration_mins,
        -0.780 AS initial_theta,
        s.theta AS final_theta,
        COUNT(i.id)::int AS total_questions,
        SUM(CASE WHEN i."isCorrect" THEN 1 ELSE 0 END)::int AS correct,
        ROUND(100.0 * SUM(CASE WHEN i."isCorrect" THEN 1 ELSE 0 END) / NULLIF(COUNT(i.id), 0), 1) AS accuracy_pct,
        ROUND(AVG(i."responseTimeMs") / 1000.0, 1) AS avg_response_secs,
        sus."susScore" AS sus_score
      FROM "User" u
      JOIN "Session" s ON s."userId" = u.id
      LEFT JOIN "Interaction" i ON i."sessionId" = s.id
      LEFT JOIN "SUSResponse" sus ON sus."userId" = u.id
      WHERE u.email NOT LIKE '%example.com'
        AND u.email NOT LIKE '%study.local'
        AND u.email NOT IN ('test@elearning.dev', 'asds@email.com', '123@email.com', '1223@email.com')
      GROUP BY u.id, u.name, u.email, u."createdAt", s.id, s.condition, s."startedAt", s."completedAt", s.theta, sus."susScore"
      ORDER BY s."startedAt" DESC
    `,

    prisma.$queryRaw<Array<{ count: number; avg_score: number; min_score: number; max_score: number }>>`
      SELECT
        COUNT(*)::int AS count,
        ROUND(AVG("susScore"), 1) AS avg_score,
        MIN("susScore") AS min_score,
        MAX("susScore") AS max_score
      FROM "SUSResponse"
    `,

    prisma.$queryRaw<Array<{ kc_id: string; avg_p_learned: number; mastered_count: number; total_count: number }>>`
      SELECT
        km."kcId" AS kc_id,
        ROUND(AVG(km."pLearned"), 3) AS avg_p_learned,
        SUM(CASE WHEN km."masteredAt" IS NOT NULL THEN 1 ELSE 0 END)::int AS mastered_count,
        COUNT(*)::int AS total_count
      FROM "KCMastery" km
      JOIN "Session" s ON s.id = km."sessionId"
      JOIN "User" u ON u.id = s."userId"
      WHERE u.email NOT LIKE '%example.com'
        AND u.email NOT LIKE '%study.local'
        AND u.email NOT IN ('test@elearning.dev', 'asds@email.com', '123@email.com', '1223@email.com')
      GROUP BY km."kcId"
      ORDER BY avg_p_learned DESC
    `,
  ]);

  const completedSessions = participants.filter((p) => p.completed !== null);
  const thetaGains = completedSessions.map((p) => Number(p.final_theta) - (-0.780));
  const avgThetaGain = thetaGains.length > 0
    ? thetaGains.reduce((a, b) => a + b, 0) / thetaGains.length
    : 0;

  return NextResponse.json({
    participants,
    summary: {
      total_signups: participants.length,
      completed_sessions: completedSessions.length,
      avg_theta_gain: Math.round(avgThetaGain * 1000) / 1000,
      sus: susSummary[0] || { count: 0, avg_score: 0, min_score: 0, max_score: 0 },
    },
    kc_masteries: kcMasteries,
  });
}
