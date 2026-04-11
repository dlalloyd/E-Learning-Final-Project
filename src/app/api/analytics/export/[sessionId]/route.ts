/**
 * GET /api/analytics/export/[sessionId]
 * Exports full session data for research analysis.
 *
 * Query params:
 *   ?format=json  (default) - structured JSON payload
 *   ?format=csv   - flat CSV of interactions with Content-Disposition attachment header
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const format = req.nextUrl.searchParams.get('format') ?? 'json';

    // ── 1. Session metadata ─────────────────────────────────────────────────
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        condition: true,
        theta: true,
        thetaSd: true,
        completedAt: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ── 2. Interactions (include question for kc field) ──────────────────────
    const rawInteractions = await prisma.interaction.findMany({
      where: { sessionId },
      include: {
        question: {
          select: { kc: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const interactions = rawInteractions.map((i: typeof rawInteractions[number], index: number) => ({
      index: index + 1,
      questionId: i.questionId,
      kc: i.question.kc,
      isCorrect: i.isCorrect,
      responseTimeMs: i.responseTimeMs,
      thetaBefore: i.theta_before,
      thetaAfter: i.theta_after,
      pLearnedBefore: i.pLearned_before,
      pLearnedAfter: i.pLearned_after,
      cognitiveLoad: i.cognitiveLoad ?? null,
      timestamp: i.createdAt.toISOString(),
    }));

    // ── 3. Analytics events ─────────────────────────────────────────────────
    const rawEvents = await prisma.analyticsEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    const analyticsEvents = rawEvents.map((e: typeof rawEvents[number]) => ({
      eventType: e.eventType,
      payload: e.payload,
      timestamp: e.timestamp.toISOString(),
    }));

    // ── 4. Confidence calibration ───────────────────────────────────────────
    const calibrationRecord = await prisma.confidenceCalibration.findUnique({
      where: { sessionId },
      select: {
        highConfCorrect: true,
        highConfWrong: true,
        lowConfCorrect: true,
        lowConfWrong: true,
      },
    });

    const confidenceCalibration = calibrationRecord ?? null;

    // ── 5. Format and respond ───────────────────────────────────────────────
    if (format === 'csv') {
      const csv = buildCsv(interactions);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="session_${sessionId}.csv"`,
        },
      });
    }

    // Default: JSON
    return NextResponse.json({
      session: {
        id: session.id,
        userId: session.userId,
        condition: session.condition,
        theta: session.theta,
        thetaSd: session.thetaSd,
        completedAt: session.completedAt?.toISOString() ?? null,
      },
      interactions,
      analyticsEvents,
      confidenceCalibration,
    });
  } catch (error) {
    console.error('GET /api/analytics/export/[sessionId] error:', error);
    return NextResponse.json(
      { error: 'Failed to export session data' },
      { status: 500 }
    );
  }
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

type InteractionRow = {
  index: number;
  questionId: string;
  kc: string;
  isCorrect: boolean;
  responseTimeMs: number;
  thetaBefore: number;
  thetaAfter: number;
  pLearnedBefore: number;
  pLearnedAfter: number;
  cognitiveLoad: number | null;
  timestamp: string;
};

const CSV_COLUMNS: Array<keyof InteractionRow> = [
  'index',
  'questionId',
  'kc',
  'isCorrect',
  'responseTimeMs',
  'thetaBefore',
  'thetaAfter',
  'pLearnedBefore',
  'pLearnedAfter',
  'cognitiveLoad',
  'timestamp',
];

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if the value contains a comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: InteractionRow[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map((row) =>
    CSV_COLUMNS.map((col) => escapeCsvValue(row[col])).join(',')
  );
  return [header, ...lines].join('\n');
}
