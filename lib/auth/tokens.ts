import { jwtVerify, SignJWT } from 'jose';
import type { DemoRole, DemoSessionPayload, DemoSessionUser } from '@/types';

export const DEMO_COOKIE_NAME = 'jansahayak_demo_session';
export const DEMO_SESSION_EXPIRY_SECONDS = 2 * 60 * 60; // 2 hours

const DEFAULT_SECRET = 'jansahayak_demo_super_secret_signing_key_32_chars_min';

export function getSigningKey(): Uint8Array {
  const secret = process.env.DEMO_SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret.padEnd(32, '!'));
}

export const DEMO_PROFILES: Record<DemoRole, DemoSessionUser> = {
  citizen: {
    role: 'citizen',
    name: 'Citizen Demo User',
    email: 'citizen.demo@jansahayak.local',
    designation: 'Demonstration Citizen (Lashkar)',
    ward: 'Ward 24 (Lashkar)',
    zone: 'Lashkar Zone',
    avatarInitials: 'C',
  },
  worker: {
    role: 'worker',
    name: 'Sanitation Worker Demo',
    email: 'worker.demo@jansahayak.local',
    designation: 'Sanitation Field Staff (Demo)',
    ward: 'Ward 12 (Morar)',
    zone: 'Morar Zone',
    avatarInitials: 'W',
  },
  officer: {
    role: 'officer',
    name: 'Municipal Officer Demo',
    email: 'officer.demo@jansahayak.local',
    designation: 'Health & Sanitation Officer (Demo)',
    ward: 'All Wards (1-66)',
    zone: 'Gwalior Municipal Corporation',
    avatarInitials: 'O',
  },
};

/**
 * Creates a cryptographically signed demonstration JWT.
 */
export async function createDemoToken(user: DemoSessionUser): Promise<string> {
  const key = getSigningKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    user,
    issuedAt: now,
    expiresAt: now + DEMO_SESSION_EXPIRY_SECONDS,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(`${DEMO_SESSION_EXPIRY_SECONDS}s`)
    .sign(key);
}

/**
 * Verifies the short-lived signed demonstration cookie token.
 */
export async function verifyDemoToken(token: string): Promise<DemoSessionPayload | null> {
  try {
    const key = getSigningKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    const typedPayload = payload as unknown as DemoSessionPayload;
    if (!typedPayload.user || !typedPayload.user.role) {
      return null;
    }

    return typedPayload;
  } catch {
    return null;
  }
}

