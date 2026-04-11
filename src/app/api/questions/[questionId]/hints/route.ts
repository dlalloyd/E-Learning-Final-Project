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

    // First try direct lookup (questionId is a Question.id from the old model)
    let hints = await prisma.hint.findMany({
      where: { questionId },
      orderBy: { hintLevel: 'asc' },
      select: {
        id: true,
        hintText: true,
        hintLevel: true,
        orderIndex: true,
      },
    });

    // If no hints found, the questionId might be a QuestionVariant ID.
    // Look up the variant's template, then find the original Question that
    // shares the same KC + bloom level to fetch its hints.
    if (hints.length === 0) {
      const variant = await prisma.questionVariant.findUnique({
        where: { id: questionId },
        include: { template: true },
      });

      if (variant?.template) {
        // Find the original Question model that matches this template's KC and bloom
        const originalQuestion = await prisma.question.findFirst({
          where: {
            kc: variant.template.kcId,
            bloom: variant.template.bloomLevel,
          },
        });

        if (originalQuestion) {
          hints = await prisma.hint.findMany({
            where: { questionId: originalQuestion.id },
            orderBy: { hintLevel: 'asc' },
            select: {
              id: true,
              hintText: true,
              hintLevel: true,
              orderIndex: true,
            },
          });
        }
      }
    }

    return NextResponse.json({ hints });
  } catch (error) {
    console.error('GET /api/questions/[questionId]/hints error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
