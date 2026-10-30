import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  requireApiRole,
  requireAnyApiRole,
  requireApiSession,
} from '../lib/auth/api-guards';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '../lib/auth/tokens';

function createMockRequest(token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  }
  return new NextRequest('http://localhost:3000/api/test', { headers });
}

test('API Guards: requireApiSession rejects requests missing demo session cookie', async () => {
  const req = createMockRequest();
  const auth = await requireApiSession(req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response.status, 401);
});

test('API Guards: requireApiSession accepts requests with valid demo session cookie', async () => {
  const token = await createDemoToken(DEMO_PROFILES.citizen);
  const req = createMockRequest(token);
  const auth = await requireApiSession(req);

  assert.ok(auth.session);
  assert.strictEqual(auth.session.user.role, 'citizen');
  assert.strictEqual(auth.response, undefined);
});

test('API Guards: requireApiRole enforces role-specific permissions', async () => {
  const citizenToken = await createDemoToken(DEMO_PROFILES.citizen);
  const req = createMockRequest(citizenToken);

  // Authorizing citizen should succeed
  const citizenAuth = await requireApiRole('citizen', req);
  assert.ok(citizenAuth.session);
  assert.strictEqual(citizenAuth.session.user.role, 'citizen');

  // Authorizing officer should fail with 403 Forbidden
  const officerAuth = await requireApiRole('officer', req);
  assert.ok(officerAuth.response);
  assert.strictEqual(officerAuth.response.status, 403);
});

test('API Guards: requireAnyApiRole accepts any role in allowed set', async () => {
  const workerToken = await createDemoToken(DEMO_PROFILES.worker);
  const req = createMockRequest(workerToken);

  const auth = await requireAnyApiRole(['worker', 'officer'], req);
  assert.ok(auth.session);
  assert.strictEqual(auth.session.user.role, 'worker');

  const rejected = await requireAnyApiRole(['citizen', 'officer'], req);
  assert.ok(rejected.response);
  assert.strictEqual(rejected.response.status, 403);
});

