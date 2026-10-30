import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDemoToken,
  verifyDemoToken,
  DEMO_PROFILES,
} from '../lib/auth/tokens';
import { setRoleRequestSchema } from '../lib/validation/demo-session';
import type { DemoRole } from '../types';

test('Demo Session: generates valid signed tokens for all 3 roles', async () => {
  const roles: DemoRole[] = ['citizen', 'worker', 'officer'];

  for (const role of roles) {
    const profile = DEMO_PROFILES[role];
    const token = await createDemoToken(profile);

    assert.ok(token, 'Token string should be non-empty');
    assert.strictEqual(typeof token, 'string');

    // Verify token decodes properly
    const verified = await verifyDemoToken(token);
    assert.ok(verified, 'Verified payload must be present');
    assert.strictEqual(verified.user.role, role);
    assert.strictEqual(verified.user.name, profile.name);
    assert.ok(verified.expiresAt > verified.issuedAt);
  }
});

test('Demo Session: rejects tampered or malformed tokens', async () => {
  const verifiedInvalid = await verifyDemoToken('malformed.token.payload');
  assert.strictEqual(verifiedInvalid, null);

  const profile = DEMO_PROFILES.citizen;
  const token = await createDemoToken(profile);
  // Tamper with the token signature
  const tampered = token.slice(0, -6) + 'xxxxxx';
  const verifiedTampered = await verifyDemoToken(tampered);
  assert.strictEqual(verifiedTampered, null);
});

test('Validation: accepts valid demo roles', () => {
  const validCitizen = setRoleRequestSchema.safeParse({ role: 'citizen' });
  assert.ok(validCitizen.success);

  const validWorker = setRoleRequestSchema.safeParse({ role: 'worker' });
  assert.ok(validWorker.success);

  const validOfficer = setRoleRequestSchema.safeParse({ role: 'officer' });
  assert.ok(validOfficer.success);
});

test('Validation: rejects unauthorized or invalid roles', () => {
  const invalidRole = setRoleRequestSchema.safeParse({ role: 'superadmin' });
  assert.strictEqual(invalidRole.success, false);

  const emptyRole = setRoleRequestSchema.safeParse({});
  assert.strictEqual(emptyRole.success, false);
});
