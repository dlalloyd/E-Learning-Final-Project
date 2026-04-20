import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import prisma from '@/lib/db/client';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`forgot-password:${ip}`);
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always return success to avoid user enumeration
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://e-learning-final-project.vercel.app';
    const resetUrl = `${appUrl}?reset=${token}`;

    await resend.emails.send({
      from: 'GeoMentor <noreply@geomentor.app>',
      to: user.email,
      subject: 'Reset your GeoMentor password',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0b1323; color: #dbe2f8; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; font-size: 20px; color: #ffffff;">Reset your password</h2>
          <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px;">Hi ${user.name}, click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Reset Password</a>
          <p style="margin: 24px 0 0; color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
