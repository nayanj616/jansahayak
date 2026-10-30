import { NextRequest, NextResponse } from 'next/server';
import {
  clearDemoSessionCookie,
  getDemoSession,
  setDemoSessionCookie,
} from '@/lib/auth/demo-session';
import { setRoleRequestSchema } from '@/lib/validation/demo-session';

/**
 * GET /api/demo-session
 * Returns the currently active verified demonstration session or null.
 */
export async function GET() {
  const session = await getDemoSession();
  return NextResponse.json({
    active: Boolean(session),
    session,
  });
}

/**
 * POST /api/demo-session
 * Sets the signed demonstration session cookie for the chosen role.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = setRoleRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid role selection',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { role, redirectUrl } = parsed.data;
    const session = await setDemoSessionCookie(role);

    const defaultRedirect =
      role === 'citizen'
        ? '/citizen'
        : role === 'worker'
          ? '/worker'
          : '/officer';

    return NextResponse.json({
      success: true,
      message: `Demonstration role set to ${role}`,
      role,
      user: session.user,
      redirectTo: redirectUrl || defaultRedirect,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to set demo session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demo-session
 * Clears the demonstration session cookie.
 */
export async function DELETE() {
  await clearDemoSessionCookie();
  return NextResponse.json({
    success: true,
    message: 'Demonstration session cleared',
  });
}

