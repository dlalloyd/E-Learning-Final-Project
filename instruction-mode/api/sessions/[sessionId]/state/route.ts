// app/api/sessions/[sessionId]/state/route.ts
// Manages the UserSessionState for mode switching

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Retrieve current session state
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const state = await prisma.userSessionState.findUnique({
      where: { sessionId },
    });

    if (!state) {
      // Return default state if none exists
      return NextResponse.json({
        state: {
          currentMode: 'assessing',
          currentKCId: null,
          consecutiveFails: 0,
          interventionCount: 0,
          scaffoldRequests: 0,
          hintsUsed: 0,
          triggerReason: null,
        },
      });
    }

    return NextResponse.json({
      state: {
        currentMode: state.currentMode,
        currentKCId: state.currentKCId,
        consecutiveFails: state.consecutiveFails,
        interventionCount: state.interventionCount,
        scaffoldRequests: state.scaffoldRequests,
        hintsUsed: state.hintsUsed,
        triggerReason: null, // Not persisted, only runtime
      },
    });
  } catch (error) {
    console.error('Error fetching session state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session state' },
      { status: 500 }
    );
  }
}

// PUT - Update session state
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await request.json();

    const state = await prisma.userSessionState.upsert({
      where: { sessionId },
      update: {
        currentMode: body.currentMode,
        currentKCId: body.currentKCId,
        consecutiveFails: body.consecutiveFails,
        interventionCount: body.interventionCount,
        scaffoldRequests: body.scaffoldRequests,
        hintsUsed: body.hintsUsed,
      },
      create: {
        sessionId,
        currentMode: body.currentMode || 'assessing',
        currentKCId: body.currentKCId,
        consecutiveFails: body.consecutiveFails || 0,
        interventionCount: body.interventionCount || 0,
        scaffoldRequests: body.scaffoldRequests || 0,
        hintsUsed: body.hintsUsed || 0,
      },
    });

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Error updating session state:', error);
    return NextResponse.json(
      { error: 'Failed to update session state' },
      { status: 500 }
    );
  }
}
