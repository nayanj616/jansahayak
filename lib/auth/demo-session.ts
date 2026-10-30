import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { DemoRole, DemoSessionPayload } from '@/types';
import {
  DEMO_COOKIE_NAME,
  DEMO_PROFILES,
  DEMO_SESSION_EXPIRY_SECONDS,
  createDemoToken,
  verifyDemoToken,
} from './tokens';

export {
  DEMO_COOKIE_NAME,
  DEMO_PROFILES,
  DEMO_SESSION_EXPIRY_SECONDS,
  createDemoToken,
  verifyDemoToken,
};

/**
 * Retrieves the current verified demonstration session from cookies.
 * Server-side verification only.
 */
export async function getDemoSession(): Promise<DemoSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyDemoToken(token);
}

/**
 * Enforces that a specific demo role is active.
 * Redirects to the role selector if not active or mismatched.
 */
export async function requireDemoRole(requiredRole: DemoRole): Promise<DemoSessionPayload> {
  const session = await getDemoSession();

  if (!session) {
    redirect(`/demo-role?required=${requiredRole}`);
  }

  if (session.user.role !== requiredRole) {
    redirect(`/demo-role?mismatch=true&required=${requiredRole}&current=${session.user.role}`);
  }

  return session;
}

/**
 * Enforces that any valid demo session is active (optionally restricted to a subset).
 */
export async function requireAnyDemoRole(allowedRoles?: DemoRole[]): Promise<DemoSessionPayload> {
  const session = await getDemoSession();

  if (!session) {
    redirect('/demo-role');
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect(`/demo-role?unauthorized=true&current=${session.user.role}`);
  }

  return session;
}

/**
 * Sets the signed demo session cookie.
 */
export async function setDemoSessionCookie(role: DemoRole): Promise<DemoSessionPayload> {
  const profile = DEMO_PROFILES[role];
  const token = await createDemoToken(profile);
  const cookieStore = await cookies();

  cookieStore.set(DEMO_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_SESSION_EXPIRY_SECONDS,
  });

  const now = Math.floor(Date.now() / 1000);
  return {
    user: profile,
    issuedAt: now,
    expiresAt: now + DEMO_SESSION_EXPIRY_SECONDS,
  };
}

/**
 * Clears the demonstration session cookie.
 */
export async function clearDemoSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
}
