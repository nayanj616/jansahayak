import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDemoToken,
  verifyDemoToken,
  DEMO_PROFILES,
  getSigningKey,
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

test('Demo Session: rejects expired tokens', async () => {
  const profile = DEMO_PROFILES.citizen;
  // Create an expired token by setting negative expiry duration
  const expiredToken = await createDemoToken(profile, -1);
  const verified = await verifyDemoToken(expiredToken);
  assert.strictEqual(verified, null, 'Expired token must be rejected');
});

test('Demo Session: signing key has cryptographic entropy and minimum length', () => {
  const key = getSigningKey();
  assert.ok(key instanceof Uint8Array);
  assert.ok(key.length >= 32, 'Key must be at least 256 bits (32 bytes)');
});

test('Validation: accepts valid demo roles and relative redirect URLs', () => {
  const validCitizen = setRoleRequestSchema.safeParse({
    role: 'citizen',
    redirectUrl: '/citizen',
  });
  assert.ok(validCitizen.success);

  const validWorker = setRoleRequestSchema.safeParse({
    role: 'worker',
    redirectUrl: '/worker',
  });
  assert.ok(validWorker.success);

  const validOfficer = setRoleRequestSchema.safeParse({
    role: 'officer',
    redirectUrl: '/officer',
  });
  assert.ok(validOfficer.success);
});

test('Validation: rejects unauthorized roles and dangerous open redirect URLs', () => {
  const invalidRole = setRoleRequestSchema.safeParse({ role: 'superadmin' });
  assert.strictEqual(invalidRole.success, false);

  const emptyRole = setRoleRequestSchema.safeParse({});
  assert.strictEqual(emptyRole.success, false);

  const externalRedirect = setRoleRequestSchema.safeParse({
    role: 'citizen',
    redirectUrl: 'https://malicious-site.example.com/exploit',
  });
  assert.strictEqual(externalRedirect.success, false);

  const protocolRelative = setRoleRequestSchema.safeParse({
    role: 'citizen',
    redirectUrl: '//malicious-site.example.com',
  });
  assert.strictEqual(protocolRelative.success, false);
});
