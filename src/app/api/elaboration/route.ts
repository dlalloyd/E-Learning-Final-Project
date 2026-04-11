/**
 * Elaborative Interrogation API (Feature 6)
 *
 * Dunlosky et al. (2013) meta-analysis rated elaborative interrogation
 * as a "moderate utility" strategy. Asking "why is this the answer?"
 * forces deep processing and strengthens understanding.
 *
 * POST - save a learner's self-explanation response
 * GET  - retrieve elaborations for a session (for researcher export)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

// Prompts tied to Bloom levels
const ELABORATION_PROMPTS: Record<number, string[]> = {
  1: [
    'How would you remember this fact?',
    'What makes this different from similar items?',
    'Can you connect this to something you already know?',
  ],
  2: [
    'Why is this the correct answer?',
    'What would happen if the opposite were true?',
    'How does this relate to the other concepts you have learned?',
  ],
  3: [
    'How would you apply this knowledge to a new situation?',
    'What assumptions did you make when answering?',
    'Could this answer change under different conditions? Why?',
  ],
};

function getRandomPrompt(bloomLevel: number): string {
  const prompts = ELABORATION_PROMPTS[bloomLevel] || ELABORATION_PROMPTS[1];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId, questionId, kcId, prompt, response, responseTimeMs } = await req.json();

    if (!sessionId || !questionId || !kcId || !prompt || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const elaboration = await prisma.elaborationResponse.create({
      data: {
        userId: auth.userId,
        sessionId,
        questionId,
        kcId,
        prompt,
        response,
        responseTimeMs: responseTimeMs || null,
      },
    });

    return NextResponse.json({ id: elaboration.id, saved: true });
  } catch (error) {
    console.error('POST /api/elaboration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const userId = req.nextUrl.searchParams.get('userId');

    const where: Record<string, string> = {};
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;

    if (Object.keys(where).length === 0) {
      return NextResponse.json({ error: 'sessionId or userId required' }, { status: 400 });
    }

    const responses = await prisma.elaborationResponse.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ responses, count: responses.length });
  } catch (error) {
    console.error('GET /api/elaboration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
