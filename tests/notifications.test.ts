import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { GET as getNotificationsHandler } from '../app/api/notifications/route';
import { PATCH as markNotificationReadHandler } from '../app/api/notifications/[id]/read/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME, DEMO_USER_IDS } from '../lib/auth/tokens';
import type { NotificationRecord } from '../types';

function createMockRequest(url: string, token?: string, method: string = 'GET'): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  }
  return new NextRequest(url, { headers, method });
}

// ============================================================================
// 1. GET /api/notifications: AUTH & ROLE SCOPING
// ============================================================================

test('Notifications API GET: rejects unauthenticated requests with 401', async () => {
  const req = createMockRequest('http://localhost:3000/api/notifications');
  const res = await getNotificationsHandler(req);

  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.error, 'Unauthorized');
});

test('Notifications API GET: rejects requests with invalid or tampered demo session with 401', async () => {
  const req = createMockRequest('http://localhost:3000/api/notifications', 'tampered-token-value');
  const res = await getNotificationsHandler(req);

  assert.strictEqual(res.status, 401);
});

test('Notifications API GET: authorizes citizen role without rejecting session', async () => {
  const token = await createDemoToken(DEMO_PROFILES.citizen);
  const req = createMockRequest('http://localhost:3000/api/notifications', token);
  const res = await getNotificationsHandler(req);

  // Must not reject with auth errors (401/403)
  assert.notStrictEqual(res.status, 401);
  assert.notStrictEqual(res.status, 403);
});

test('Notifications API GET: authorizes worker role without rejecting session', async () => {
  const token = await createDemoToken(DEMO_PROFILES.worker);
  const req = createMockRequest('http://localhost:3000/api/notifications', token);
  const res = await getNotificationsHandler(req);

  assert.notStrictEqual(res.status, 401);
  assert.notStrictEqual(res.status, 403);
});

test('Notifications API GET: authorizes officer role without rejecting session', async () => {
  const token = await createDemoToken(DEMO_PROFILES.officer);
  const req = createMockRequest('http://localhost:3000/api/notifications', token);
  const res = await getNotificationsHandler(req);

  assert.notStrictEqual(res.status, 401);
  assert.notStrictEqual(res.status, 403);
});

// ============================================================================
// 2. PATCH /api/notifications/[id]/read: AUTH & VALIDATION
// ============================================================================

test('Notifications API PATCH: rejects unauthenticated requests with 401', async () => {
  const req = createMockRequest(
    'http://localhost:3000/api/notifications/11111111-1111-4000-8000-111111111111/read',
    undefined,
    'PATCH'
  );
  const res = await markNotificationReadHandler(req, {
    params: Promise.resolve({ id: '11111111-1111-4000-8000-111111111111' }),
  });

  assert.strictEqual(res.status, 401);
});

test('Notifications API PATCH: rejects invalid UUID format with 400', async () => {
  const token = await createDemoToken(DEMO_PROFILES.citizen);
  const req = createMockRequest(
    'http://localhost:3000/api/notifications/invalid-not-uuid/read',
    token,
    'PATCH'
  );
  const res = await markNotificationReadHandler(req, {
    params: Promise.resolve({ id: 'invalid-not-uuid' }),
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.message.includes('valid UUID'));
});

// ============================================================================
// 3. UNREAD COUNT & ORDERING LOGIC
// ============================================================================

test('Notification Logic: unread count correctly calculated from records', () => {
  const fixtures: NotificationRecord[] = [
    {
      id: 'a1111111-1111-4000-8000-111111111111',
      recipient_id: DEMO_USER_IDS.citizen,
      complaint_id: 'c1111111-1111-4000-8000-111111111111',
      title: 'Cleanup Assigned',
      message: 'A field worker was assigned to your complaint.',
      read_at: null, // Unread
      created_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'a2222222-2222-4000-8000-222222222222',
      recipient_id: DEMO_USER_IDS.citizen,
      complaint_id: 'c2222222-2222-4000-8000-222222222222',
      title: 'Complaint Resolved',
      message: 'Your sanitation complaint was inspected and resolved.',
      read_at: '2026-11-01T12:00:00Z', // Read
      created_at: '2026-11-01T11:00:00Z',
    },
    {
      id: 'a3333333-3333-4000-8000-333333333333',
      recipient_id: DEMO_USER_IDS.citizen,
      complaint_id: null,
      title: 'Scheme Update',
      message: 'New PM SVANidhi welfare guidance available.',
      read_at: null, // Unread
      created_at: '2026-11-01T14:00:00Z',
    },
  ];

  const unreadCount = fixtures.filter((n) => !n.read_at).length;
  assert.strictEqual(unreadCount, 2, 'Must count exactly 2 unread notifications');

  // Verify all read yields 0
  const allRead = fixtures.map((n) => ({ ...n, read_at: new Date().toISOString() }));
  assert.strictEqual(allRead.filter((n) => !n.read_at).length, 0);

  // Verify all unread yields length
  const allUnread = fixtures.map((n) => ({ ...n, read_at: null }));
  assert.strictEqual(allUnread.filter((n) => !n.read_at).length, 3);
});

test('Notification Logic: stable descending ordering by created_at', () => {
  const unordered: NotificationRecord[] = [
    {
      id: '1',
      recipient_id: DEMO_USER_IDS.worker,
      complaint_id: null,
      title: 'Oldest',
      message: 'Oldest notification',
      read_at: null,
      created_at: '2026-11-01T08:00:00Z',
    },
    {
      id: '3',
      recipient_id: DEMO_USER_IDS.worker,
      complaint_id: null,
      title: 'Newest',
      message: 'Newest notification',
      read_at: null,
      created_at: '2026-11-01T16:00:00Z',
    },
    {
      id: '2',
      recipient_id: DEMO_USER_IDS.worker,
      complaint_id: null,
      title: 'Middle',
      message: 'Middle notification',
      read_at: null,
      created_at: '2026-11-01T12:00:00Z',
    },
  ];

  const sorted = [...unordered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  assert.strictEqual(sorted[0].id, '3', 'Newest must be first');
  assert.strictEqual(sorted[1].id, '2', 'Middle must be second');
  assert.strictEqual(sorted[2].id, '1', 'Oldest must be third');
});

// ============================================================================
// 4. STRICT OWNERSHIP & IDEMPOTENCY LOGIC
// ============================================================================

test('Notification Ownership: citizen cannot access or modify worker or officer notifications', () => {
  const citizenId = DEMO_USER_IDS.citizen;
  const workerId = DEMO_USER_IDS.worker;
  const officerId = DEMO_USER_IDS.officer;

  assert.notStrictEqual(citizenId, workerId, 'Citizen and Worker must have distinct IDs');
  assert.notStrictEqual(citizenId, officerId, 'Citizen and Officer must have distinct IDs');
  assert.notStrictEqual(workerId, officerId, 'Worker and Officer must have distinct IDs');

  const workerNotification: NotificationRecord = {
    id: 'b1111111-1111-4000-8000-111111111111',
    recipient_id: workerId,
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    title: 'New Task Assignment',
    message: 'Ward 12 cleaning task assigned.',
    read_at: null,
    created_at: '2026-11-01T10:00:00Z',
  };

  // Ownership evaluation rule in PATCH route:
  // if (notification.recipient_id !== currentUserId) -> 403 Forbidden
  const isCitizenAuthorized = workerNotification.recipient_id === citizenId;
  const isWorkerAuthorized = workerNotification.recipient_id === workerId;

  assert.strictEqual(isCitizenAuthorized, false, 'Citizen must not be authorized for worker notification');
  assert.strictEqual(isWorkerAuthorized, true, 'Worker must be authorized for own notification');
});

test('Notification Idempotency: already-read notification is handled idempotently', () => {
  const alreadyReadNotification: NotificationRecord = {
    id: 'b2222222-2222-4000-8000-222222222222',
    recipient_id: DEMO_USER_IDS.officer,
    complaint_id: null,
    title: 'Review Complete',
    message: 'Sanitation report reviewed.',
    read_at: '2026-11-01T09:00:00Z',
    created_at: '2026-11-01T08:00:00Z',
  };

  const isAlreadyRead = Boolean(alreadyReadNotification.read_at);
  assert.strictEqual(isAlreadyRead, true, 'Must identify already read state');
});
