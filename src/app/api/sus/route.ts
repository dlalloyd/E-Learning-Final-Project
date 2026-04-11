/**
 * System Usability Scale (SUS) API
 * Brooke (1996) - industry standard 10-item usability questionnaire.
 * Score range: 0-100. Above 68 = above average usability.
 *
 * POST - submit SUS response and calculate score
 * GET  - retrieve scores for export
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

function calculateSUSScore(q: Record<string, number>): number {
  // Odd items (1,3,5,7,9): score - 1
  // Even items (2,4,6,8,10): 5 - score
  const contributions = [
    q.q1 - 1, 5 - q.q2, q.q3 - 1, 5 - q.q4, q.q5 - 1,
    5 - q.q6, q.q7 - 1, 5 - q.q8, q.q9 - 1, 5 - q.q10,
  ];
  return contributions.reduce((a, b) => a + b, 0) * 2.5;
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const required = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'];
    for (const key of required) {
      const val = body[key];
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ error: `${key} must be 1-5` }, { status: 400 });
      }
    }

    const susScore = calculateSUSScore(body);

    const response = await prisma.sUSResponse.create({
      data: {
        userId: auth.userId,
        q1: body.q1, q2: body.q2, q3: body.q3, q4: body.q4, q5: body.q5,
        q6: body.q6, q7: body.q7, q8: body.q8, q9: body.q9, q10: body.q10,
        susScore,
      },
    });

    const grade = susScore >= 80 ? 'A' : susScore >= 68 ? 'B' : susScore >= 50 ? 'C' : 'D';

    return NextResponse.json({
      id: response.id,
      susScore: Math.round(susScore * 10) / 10,
      grade,
      interpretation: susScore >= 68
        ? 'Above average usability'
        : 'Below average - improvements needed',
    });
  } catch (error) {
    console.error('POST /api/sus error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const all = await prisma.sUSResponse.findMany({
      orderBy: { createdAt: 'desc' },
      select: { susScore: true, createdAt: true },
    });

    const scores = all.map((r) => r.susScore).filter((s): s is number => s !== null);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return NextResponse.json({
      totalResponses: all.length,
      averageSUS: Math.round(avg * 10) / 10,
      scores,
    });
  } catch (error) {
    console.error('GET /api/sus error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
