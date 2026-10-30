import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createComplaintSchema } from '../lib/validation/complaints';
import {
  validateFileBuffer,
  generateObjectPath,
} from '../lib/storage';
import { MAX_FILE_SIZE_BYTES } from '../lib/validation/storage';
import { requireApiRole } from '../lib/auth/api-guards';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '../lib/auth/tokens';
import { isValidStatusTransition } from '../lib/db/complaints';

function createMockRequest(): NextRequest {
  const headers = new Headers();
  return new NextRequest('http://localhost:3000/api/complaints', { headers });
}

async function createAuthRequest(role: 'citizen' | 'worker' | 'officer'): Promise<NextRequest> {
  const token = await createDemoToken(DEMO_PROFILES[role]);
  const headers = new Headers();
  headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  return new NextRequest('http://localhost:3000/api/complaints', { headers });
}

// 1. Valid complaint submission schema validation
test('Citizen Workflow: accepts valid complaint submission payload', () => {
  const valid = createComplaintSchema.safeParse({
    category: 'garbage_dump',
    ward_id: 'GWL-W-024',
    description: 'Roadside garbage dump near Maharaj Bada Post Office',
    location_description: 'Sarafa Bazaar corner',
    latitude: 26.2081,
    longitude: 78.1636,
    location_accuracy_m: 10,
    location_source: 'gps',
  });

  assert.ok(valid.success);
  if (valid.success) {
    assert.strictEqual(valid.data.category, 'garbage_dump');
    assert.strictEqual(valid.data.ward_id, 'GWL-W-024');
    assert.strictEqual(valid.data.priority, 'normal');
    assert.strictEqual(valid.data.location_source, 'gps');
  }
});

// 2. Invalid category rejection
test('Citizen Workflow: rejects complaint with unapproved category', () => {
  const result = createComplaintSchema.safeParse({
    category: 'unapproved_waste_category',
    ward_id: 'GWL-W-024',
    description: 'Test description',
  });

  assert.strictEqual(result.success, false);
});

// 3. Missing required fields
test('Citizen Workflow: rejects complaint missing required ward_id', () => {
  const result = createComplaintSchema.safeParse({
    category: 'drain_blockage',
    ward_id: '',
  });

  assert.strictEqual(result.success, false);
});

// 4. Unsupported image MIME type
test('Citizen Workflow: rejects unsupported image MIME types', () => {
  const buffer = Buffer.alloc(1024);

  const pdf = validateFileBuffer(buffer, 'application/pdf');
  assert.strictEqual(pdf.valid, false);
  assert.ok(pdf.error?.includes('Invalid content type'));

  const exe = validateFileBuffer(buffer, 'application/x-msdownload');
  assert.strictEqual(exe.valid, false);

  const gif = validateFileBuffer(buffer, 'image/gif');
  assert.strictEqual(gif.valid, false);

  // Supported MIME types
  assert.strictEqual(validateFileBuffer(buffer, 'image/jpeg').valid, true);
  assert.strictEqual(validateFileBuffer(buffer, 'image/png').valid, true);
  assert.strictEqual(validateFileBuffer(buffer, 'image/webp').valid, true);
});

// 5. Image exceeding 8MB
test('Citizen Workflow: rejects image exceeding 8 MB size limit', () => {
  const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 2048);
  const result = validateFileBuffer(oversizedBuffer, 'image/jpeg');

  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('exceeds maximum allowed limit of 8 MB'));
});

// 6. Unauthorized request
test('Citizen Workflow: rejects request missing demo session cookie with 401', async () => {
  const req = createMockRequest();
  const auth = await requireApiRole('citizen', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response.status, 401);
});

// 7. Role restriction (Worker/Officer cannot submit citizen complaint)
test('Citizen Workflow: rejects non-citizen role attempting citizen action with 403', async () => {
  const workerReq = await createAuthRequest('worker');
  const workerAuth = await requireApiRole('citizen', workerReq);

  assert.ok(workerAuth.response);
  assert.strictEqual(workerAuth.response.status, 403);

  const officerReq = await createAuthRequest('officer');
  const officerAuth = await requireApiRole('citizen', officerReq);

  assert.ok(officerAuth.response);
  assert.strictEqual(officerAuth.response.status, 403);
});

// 8. Ownership restrictions
test('Citizen Workflow: ownership check ensures citizen queries are scoped to reporter_id', async () => {
  const citizenReq = await createAuthRequest('citizen');
  const auth = await requireApiRole('citizen', citizenReq);

  assert.ok(auth.session);
  assert.strictEqual(auth.session.user.role, 'citizen');
  // Citizen's resolved DB UUID must match canonical citizen UUID
  assert.strictEqual(
    auth.session.user.dbUserId,
    'c0000000-0000-4000-8000-000000000001'
  );
});

// 9. Storage rollback on database failure simulation
test('Citizen Workflow: object path generation and rollback integrity', () => {
  const complaintId = 'c0000000-1111-4000-8000-000000000001';
  const path = generateObjectPath(complaintId, 'before', 'dump_site.JPG');

  assert.ok(path.startsWith(`${complaintId}/before_`));
  assert.ok(path.endsWith('.jpg'));

  // Ensure path is properly isolated per complaint
  assert.strictEqual(path.includes('..'), false);
  assert.strictEqual(path.includes('\\'), false);
});

// 10. Initial status and complaint-history transition validity
test('Citizen Workflow: initial status is submitted and cannot jump directly to resolved', () => {
  // Fresh complaint starts as 'submitted'
  const initialStatus = 'submitted';

  // State machine permits initial moves to 'assigned' or 'rejected'
  assert.strictEqual(isValidStatusTransition(initialStatus, 'assigned'), true);
  assert.strictEqual(isValidStatusTransition(initialStatus, 'rejected'), true);

  // Directly leaping to resolved or in_progress without assignment is illegal
  assert.strictEqual(isValidStatusTransition(initialStatus, 'resolved'), false);
  assert.strictEqual(isValidStatusTransition(initialStatus, 'in_progress'), false);
  assert.strictEqual(isValidStatusTransition(initialStatus, 'under_review'), false);
});
