import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getComplaintHandler } from '../app/api/complaints/[id]/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '../lib/auth/tokens';
import { normalizeActiveAssignment } from '../lib/db/complaints';
import type { AiVerificationRecord } from '../types';

async function createAuthRequest(
  role: 'citizen' | 'worker' | 'officer',
  url: string
): Promise<NextRequest> {
  const token = await createDemoToken(DEMO_PROFILES[role]);
  const headers = new Headers();
  headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  return new NextRequest(url, { headers });
}

function createUnauthRequest(url: string): NextRequest {
  const headers = new Headers();
  return new NextRequest(url, { headers });
}

// ============================================================================
// 1. API GUARD & ACCESS CONTROL TESTS
// ============================================================================

test('Complaint Tracking API: rejects unauthenticated requests with 401', async () => {
  const req = createUnauthRequest('http://localhost:3000/api/complaints/c1111111-1111-4000-8000-111111111111');
  const context = { params: Promise.resolve({ id: 'c1111111-1111-4000-8000-111111111111' }) };
  const res = await getComplaintHandler(req, context);
  assert.strictEqual(res.status, 401);
});

test('Complaint Tracking API: rejects missing complaint ID with 400', async () => {
  const req = await createAuthRequest('officer', 'http://localhost:3000/api/complaints/');
  const context = { params: Promise.resolve({ id: '' }) };
  const res = await getComplaintHandler(req, context);
  assert.strictEqual(res.status, 400);
});

// ============================================================================
// 2. NORMALIZATION & INTEGRITY TESTS
// ============================================================================

test('Complaint Normalization: resolves ai_verification from array to latest single record', () => {
  const olderRecord = {
    id: 'v-old',
    complaint_id: 'c1',
    before_image_id: 'b1',
    after_image_id: 'a1',
    model_name: 'gemini-1.5-flash',
    model_version: 'v1',
    processing_status: 'failed',
    processing_error: 'Timeout',
    waste_reduction_percentage: null,
    metrics: null,
    created_at: '2026-11-01T09:00:00Z',
  } as unknown as AiVerificationRecord;

  const newerRecord = {
    id: 'v-new',
    complaint_id: 'c1',
    before_image_id: 'b1',
    after_image_id: 'a1',
    model_name: 'gemini-2.5-flash',
    model_version: 'v2',
    processing_status: 'completed',
    processing_error: null,
    waste_reduction_percentage: 90,
    metrics: {} as unknown as AiVerificationRecord['metrics'],
    created_at: '2026-11-01T11:00:00Z',
  } as unknown as AiVerificationRecord;

  const complaintWithArray = {
    id: 'c1',
    current_or_latest_assignment: null,
    ai_verification: [olderRecord, newerRecord],
  };

  const normalized = normalizeActiveAssignment(complaintWithArray);
  const resolved = normalized.ai_verification as unknown as AiVerificationRecord;
  assert.strictEqual(resolved?.id, 'v-new');
  assert.strictEqual(resolved?.model_name, 'gemini-2.5-flash');
});

test('Complaint Normalization: handles empty ai_verification array gracefully as null', () => {
  const complaintWithEmpty = {
    id: 'c1',
    current_or_latest_assignment: null,
    ai_verification: [],
  };

  const normalized = normalizeActiveAssignment(complaintWithEmpty);
  assert.strictEqual(normalized.ai_verification, null);
});

test('Complaint Normalization: sorts history chronologically', () => {
  const complaintWithUnsortedHistory = {
    id: 'c1',
    current_or_latest_assignment: null,
    history: [
      { id: 'h2', created_at: '2026-11-01T12:00:00Z' },
      { id: 'h1', created_at: '2026-11-01T10:00:00Z' },
      { id: 'h3', created_at: '2026-11-01T14:00:00Z' },
    ],
  };

  const normalized = normalizeActiveAssignment(complaintWithUnsortedHistory);
  const historyList = normalized.history as Array<{ id: string }>;
  assert.strictEqual(historyList[0].id, 'h1');
  assert.strictEqual(historyList[1].id, 'h2');
  assert.strictEqual(historyList[2].id, 'h3');
});
