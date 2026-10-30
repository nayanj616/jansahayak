/**
 * Reusable Authorization Helpers for Next.js Server-Side API Handlers
 *
 * Every protected API handler performs its own server-side session and role verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { DemoRole, DemoSessionPayload } from '@/types';
import { DEMO_COOKIE_NAME, verifyDemoToken } from './tokens';

export interface ApiAuthResult {
  session: DemoSessionPayload;
  response?: never;
}

export interface ApiAuthError {
  session?: never;
  response: NextResponse;
}

/**
 * Extracts and verifies the demonstration session token from cookies
 * (either from NextRequest cookies or Next.js headers cookies()).
 */
export async function getApiSession(
  request?: NextRequest
): Promise<DemoSessionPayload | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(DEMO_COOKIE_NAME)?.value;
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(DEMO_COOKIE_NAME)?.value;
    } catch {
      // In standalone API handlers where cookies() might not resolve
    }
  }

  if (!token) {
    return null;
  }

  return verifyDemoToken(token);
}

/**
 * Ensures an active demonstration session exists.
 * Returns either { session } or { response: NextResponse } (401 Unauthorized).
 */
export async function requireApiSession(
  request?: NextRequest
): Promise<ApiAuthResult | ApiAuthError> {
  const session = await getApiSession(request);

  if (!session) {
    return {
      response: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'An active demonstration session is required to perform this action. Please select a demo role at /demo-role.',
        },
        { status: 401 }
      ),
    };
  }

  return { session };
}

/**
 * Ensures the requester possesses a specific demonstration role.
 * Returns either { session } or { response: NextResponse } (401 or 403 Forbidden).
 */
export async function requireApiRole(
  requiredRole: DemoRole,
  request?: NextRequest
): Promise<ApiAuthResult | ApiAuthError> {
  const auth = await requireApiSession(request);
  if (auth.response) {
    return auth;
  }

  if (auth.session.user.role !== requiredRole) {
    return {
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: `Forbidden: This action requires the '${requiredRole}' demonstration role, but active session is '${auth.session.user.role}'.`,
          requiredRole,
          currentRole: auth.session.user.role,
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Ensures the requester possesses one of the allowed roles.
 */
export async function requireAnyApiRole(
  allowedRoles: DemoRole[],
  request?: NextRequest
): Promise<ApiAuthResult | ApiAuthError> {
  const auth = await requireApiSession(request);
  if (auth.response) {
    return auth;
  }

  if (!allowedRoles.includes(auth.session.user.role)) {
    return {
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: `Forbidden: Allowed roles are [${allowedRoles.join(', ')}], but active session is '${auth.session.user.role}'.`,
          allowedRoles,
          currentRole: auth.session.user.role,
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}

