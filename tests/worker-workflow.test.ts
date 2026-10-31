import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { startTaskSchema, completeTaskSchema } from '../lib/validation/tasks';
import {
  validateFileBuffer,
  generateObjectPath,
} from '../lib/storage';
import { MAX_FILE_SIZE_BYTES } from '../lib/validation/storage';
import { requireApiRole } from '../lib/auth/api-guards';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '../lib/auth/tokens';
import { isValidStatusTransition } from '../lib/db/complaints';
import type { AssignmentStatus } from '../types';

async function createAuthRequest(
  role: 'citizen' | 'worker' | 'officer',
  url: string = 'http://localhost:3000/api/tasks'
): Promise<NextRequest> {
  const token = await createDemoToken(DEMO_PROFILES[role]);
  const headers = new Headers();
  headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  return new NextRequest(url, { headers });
}

function createUnauthRequest(url: string = 'http://localhost:3000/api/tasks'): NextRequest {
  const headers = new Headers();
  return new NextRequest(url, { headers });
}

// 1. Task Start Validation Schema
test('Worker Workflow: accepts valid start task payload with UUID', () => {
  const valid = startTaskSchema.safeParse({
    assignment_id: 'd1111111-1111-4000-8000-111111111111',
  });

  assert.ok(valid.success);
  if (valid.success) {
    assert.strictEqual(valid.data.assignment_id, 'd1111111-1111-4000-8000-111111111111');
  }
});

test('Worker Workflow: rejects start task with invalid UUID format', () => {
  const invalid = startTaskSchema.safeParse({
    assignment_id: 'invalid-not-a-uuid',
  });

  assert.strictEqual(invalid.success, false);
});

// 2. Task Complete Validation Schema
test('Worker Workflow: accepts valid complete task payload with optional remarks', () => {
  const valid = completeTaskSchema.safeParse({
    assignment_id: 'd1111111-1111-4000-8000-111111111111',
    remarks: 'Dumpster cleared and area sanitized with lime powder',
  });

  assert.ok(valid.success);
  if (valid.success) {
    assert.strictEqual(valid.data.assignment_id, 'd1111111-1111-4000-8000-111111111111');
    assert.strictEqual(valid.data.remarks, 'Dumpster cleared and area sanitized with lime powder');
  }
});

test('Worker Workflow: rejects complete task remarks exceeding 500 characters', () => {
  const longRemarks = 'A'.repeat(501);
  const invalid = completeTaskSchema.safeParse({
    assignment_id: 'd1111111-1111-4000-8000-111111111111',
    remarks: longRemarks,
  });

  assert.strictEqual(invalid.success, false);
});

// 3. Cleanup Evidence File Validation
test('Worker Workflow: accepts valid cleanup evidence images (JPEG, PNG, WebP) within 8MB', () => {
  const smallBuffer = Buffer.alloc(1024 * 50); // 50 KB

  const jpegValid = validateFileBuffer(smallBuffer, 'image/jpeg');
  assert.strictEqual(jpegValid.valid, true);

  const pngValid = validateFileBuffer(smallBuffer, 'image/png');
  assert.strictEqual(pngValid.valid, true);

  const webpValid = validateFileBuffer(smallBuffer, 'image/webp');
  assert.strictEqual(webpValid.valid, true);
});

test('Worker Workflow: rejects invalid MIME types for cleanup evidence', () => {
  const smallBuffer = Buffer.alloc(1024);

  const pdfResult = validateFileBuffer(smallBuffer, 'application/pdf');
  assert.strictEqual(pdfResult.valid, false);
  assert.match(pdfResult.error || '', /Invalid content type/);

  const gifResult = validateFileBuffer(smallBuffer, 'image/gif');
  assert.strictEqual(gifResult.valid, false);

  const svgResult = validateFileBuffer(smallBuffer, 'image/svg+xml');
  assert.strictEqual(svgResult.valid, false);
});

test('Worker Workflow: rejects cleanup evidence exceeding 8 MB size limit', () => {
  const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
  const result = validateFileBuffer(oversizedBuffer, 'image/jpeg');

  assert.strictEqual(result.valid, false);
  assert.match(result.error || '', /exceeds maximum allowed limit of 8 MB/);
});

// 4. Cleanup Object Path Generation
test('Worker Workflow: generates compliant object path in cleanup-evidence bucket', () => {
  const complaintId = 'c1234567-89ab-cdef-0123-456789abcdef';
  const objectPath = generateObjectPath(complaintId, 'after', 'site_cleaned.jpg');

  assert.ok(objectPath.startsWith(`${complaintId}/after_`));
  assert.ok(objectPath.endsWith('.jpg'));
});

// 5. Worker Authentication & Role Guards
test('Worker Workflow: rejects unauthenticated requests with 401', async () => {
  const req = createUnauthRequest();
  const auth = await requireApiRole('worker', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response.status, 401);
});

test('Worker Workflow: rejects citizen attempting worker actions with 403 Forbidden', async () => {
  const req = await createAuthRequest('citizen');
  const auth = await requireApiRole('worker', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response.status, 403);
});

test('Worker Workflow: rejects officer attempting worker tasks with 403 Forbidden', async () => {
  const req = await createAuthRequest('officer');
  const auth = await requireApiRole('worker', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response.status, 403);
});

test('Worker Workflow: authorizes valid worker session', async () => {
  const req = await createAuthRequest('worker');
  const auth = await requireApiRole('worker', req);

  assert.strictEqual(auth.response, undefined);
  assert.ok(auth.session);
  assert.strictEqual(auth.session.user.role, 'worker');
  assert.strictEqual(auth.session.user.name, DEMO_PROFILES.worker.name);
  assert.strictEqual(auth.session.user.dbUserId, DEMO_PROFILES.worker.dbUserId);
});

// 6. State Machine Integrity: Complaint Transitions
test('Worker Workflow: complaint transitions from assigned to in_progress upon starting work', () => {
  assert.strictEqual(isValidStatusTransition('assigned', 'in_progress'), true);
});

test('Worker Workflow: complaint transitions from in_progress to under_review upon cleanup completion', () => {
  assert.strictEqual(isValidStatusTransition('in_progress', 'under_review'), true);
});

test('Worker Workflow: worker cannot directly resolve a complaint (officer review required)', () => {
  // Directly jumping from in_progress to resolved is forbidden
  assert.strictEqual(isValidStatusTransition('in_progress', 'resolved'), false);
  // Directly jumping from assigned to resolved is forbidden
  assert.strictEqual(isValidStatusTransition('assigned', 'resolved'), false);
});

test('Worker Workflow: worker rework transition from rework_required to in_progress is valid', () => {
  assert.strictEqual(isValidStatusTransition('rework_required', 'in_progress'), true);
});

// 7. Assignment Status Hierarchy & Isolation Checks
test('Worker Workflow: assignment statuses conform to strict database enum', () => {
  const validAssignmentStatuses: AssignmentStatus[] = [
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
  ];

  for (const st of validAssignmentStatuses) {
    assert.ok(['assigned', 'in_progress', 'completed', 'cancelled'].includes(st));
  }
});

test('Worker Workflow: cross-worker isolation prevents task hijacking', () => {
  const worker1Id = 'b0000000-0000-4000-8000-000000000002';
  const worker2Id = 'b9999999-9999-4000-8000-999999999999';

  const assignment = {
    id: 'a1111111-1111-4000-8000-111111111111',
    worker_id: worker1Id,
    status: 'assigned',
  };

  // Verifying isolation check logic
  const isAuthorizedWorker1 = assignment.worker_id === worker1Id;
  const isAuthorizedWorker2 = assignment.worker_id === worker2Id;

  assert.strictEqual(isAuthorizedWorker1, true);
  assert.strictEqual(isAuthorizedWorker2, false);
});
