import type { AiVerificationRecord } from '@/types';

/**
 * Deterministically retrieves the latest AI verification record by created_at timestamp.
 * Handles null, single objects, and arrays safely.
 */
export function getLatestAiVerification(raw: unknown): AiVerificationRecord | null {
  if (!raw) return null;
  if (!Array.isArray(raw)) return raw as AiVerificationRecord;
  if (raw.length === 0) return null;
  return [...raw].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

