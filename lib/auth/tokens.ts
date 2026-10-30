import { jwtVerify, SignJWT } from 'jose';
import crypto from 'node:crypto';
import type { DemoRole, DemoSessionPayload, DemoSessionUser } from '@/types';

export const DEMO_COOKIE_NAME = 'jansahayak_demo_session';
export const DEMO_SESSION_EXPIRY_SECONDS = 2 * 60 * 60; // 2 hours

let ephemeralDevKey: Uint8Array | null = null;

/**
 * Derives a cryptographically strong signing key for demonstration session tokens.
 * Enforces minimum length and prohibits predictable hardcoded secrets.
 */
export function getSigningKey(): Uint8Array {
  const secret = process.env.DEMO_SESSION_SECRET?.trim();

  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }

  if (secret && secret.length > 0) {
    // If secret provided is under 32 characters, derive a 256-bit key via SHA-256
    return crypto.createHash('sha256').update(secret).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DEMO_SESSION_SECRET environment variable is missing or empty. A minimum 32-character secret is required in production.'
    );
  }

  // In development/test environments without configured secret, use an ephemeral cryptographically strong key
  if (!ephemeralDevKey) {
    ephemeralDevKey = crypto.randomBytes(32);
  }
  return ephemeralDevKey;
}

export const DEMO_PROFILES: Record<DemoRole, DemoSessionUser> = {
  citizen: {
    role: 'citizen',
    name: 'Citizen Demo User',
    email: 'citizen.demo@jansahayak.local',
    designation: 'Demonstration Resident Persona',
    ward: 'Demonstration Sector: Lashkar Area (Unverified Ward 24)',
    zone: 'Lashkar Demonstration Zone',
    avatarInitials: 'C',
  },
  worker: {
    role: 'worker',
    name: 'Sanitation Worker Demo',
    email: 'worker.demo@jansahayak.local',
    designation: 'Sanitation Field Staff (Demo Persona)',
    ward: 'Demonstration Sector: Morar Area (Unverified Ward 12)',
    zone: 'Morar Demonstration Zone',
    avatarInitials: 'W',
  },
  officer: {
    role: 'officer',
    name: 'Municipal Officer Demo',
    email: 'officer.demo@jansahayak.local',
    designation: 'Municipal Officer (Demo Persona)',
    ward: 'All Demonstration Sectors (1-66 Preview)',
    zone: 'GMC Administration (Demo Evaluation)',
    avatarInitials: 'O',
  },
};

/**
 * Creates a cryptographically signed demonstration JWT.
 */
export async function createDemoToken(
  user: DemoSessionUser,
  customExpirySeconds: number = DEMO_SESSION_EXPIRY_SECONDS
): Promise<string> {
  const key = getSigningKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    user,
    issuedAt: now,
    expiresAt: now + customExpirySeconds,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(`${customExpirySeconds}s`)
    .sign(key);
}

/**
 * Verifies the short-lived signed demonstration cookie token.
 * Validates HS256 signature, expiration, and payload integrity.
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

    // Validate that the role is one of the valid demo roles
    if (!['citizen', 'worker', 'officer'].includes(typedPayload.user.role)) {
      return null;
    }

    return typedPayload;
  } catch {
    // Catches signature mismatches, expired tokens (JWTExpired), and malformed tokens
    return null;
  }
}
