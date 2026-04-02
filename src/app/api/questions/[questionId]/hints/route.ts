/**
 * GET /api/questions/[questionId]/hints
 * Returns graduated hints for a question, ordered by hintLevel ascending.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params;

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      );
    }

    const hints = await prisma.hint.findMany({
      where: { questionId },
      orderBy: { hintLevel: 'asc' },
      select: {
        id: true,
        hintText: true,
        hintLevel: true,
        orderIndex: true,
      },
    });

    return NextResponse.json({ hints });
  } catch (error) {
    console.error('GET /api/questions/[questionId]/hints error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
