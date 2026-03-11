// app/api/analytics/route.ts
// Logs learning analytics events for research and system improvement

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, eventType, payload } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'sessionId and eventType are required' },
        { status: 400 }
      );
    }

    // Validate event types
    const validEventTypes = [
      'instruction_triggered',
      'instruction_requested',
      'instruction_completed',
      'hint_requested',
      'hint_viewed',
      'eli5_toggled',
      'prerequisite_requested',
      'self_assessment_submitted',
      'content_chunk_viewed',
      'session_mode_changed',
    ];

    if (!validEventTypes.includes(eventType)) {
      console.warn(`Unknown analytics event type: ${eventType}`);
    }

    // Create analytics event
    const event = await prisma.analyticsEvent.create({
      data: {
        sessionId,
        eventType,
        payload: payload || {},
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error logging analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to log analytics event' },
      { status: 500 }
    );
  }
}

// GET - Retrieve analytics for a session (for research/debugging)
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const events = await prisma.analyticsEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    // Compute summary statistics
    const summary = {
      totalEvents: events.length,
      instructionTriggered: events.filter(e => e.eventType === 'instruction_triggered').length,
      instructionRequested: events.filter(e => e.eventType === 'instruction_requested').length,
      instructionCompleted: events.filter(e => e.eventType === 'instruction_completed').length,
      hintsUsed: events.filter(e => e.eventType === 'hint_requested').length,
      eli5Toggles: events.filter(e => e.eventType === 'eli5_toggled').length,
    };

    return NextResponse.json({ events, summary });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
