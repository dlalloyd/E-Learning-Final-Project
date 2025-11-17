import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      users: userCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
      },
      { status: 500 }
    );
  }
}
