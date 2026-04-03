import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth/jwt';

export async function POST() {
  removeAuthCookie();
  return NextResponse.json({ success: true });
}
