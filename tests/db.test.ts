import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateComplaintCode,
  isValidStatusTransition,
} from '../lib/db/complaints';
import { DEMO_USER_IDS, DEMO_PROFILES } from '../lib/auth/tokens';

test('DB Layer: generateComplaintCode creates standard GWL-YYYY-XXXX format', () => {
  const code = generateComplaintCode();
  const currentYear = new Date().getFullYear();
  const regex = new RegExp(`^GWL-${currentYear}-\\d{4}$`);

  assert.ok(regex.test(code), `Code ${code} must match regex ${regex}`);
});

test('DB Layer: complaint status lifecycle transitions adhere strictly to state machine', () => {
  // Valid transitions
  assert.strictEqual(isValidStatusTransition('submitted', 'assigned'), true);
  assert.strictEqual(isValidStatusTransition('submitted', 'rejected'), true);
  assert.strictEqual(isValidStatusTransition('assigned', 'in_progress'), true);
  assert.strictEqual(isValidStatusTransition('in_progress', 'under_review'), true);
  assert.strictEqual(isValidStatusTransition('under_review', 'resolved'), true);
  assert.strictEqual(isValidStatusTransition('under_review', 'rework_required'), true);
  assert.strictEqual(isValidStatusTransition('under_review', 'rejected'), true);
  assert.strictEqual(isValidStatusTransition('rework_required', 'in_progress'), true);

  // Identity transitions (same status)
  assert.strictEqual(isValidStatusTransition('submitted', 'submitted'), true);

  // Invalid transitions
  assert.strictEqual(isValidStatusTransition('submitted', 'resolved'), false);
  assert.strictEqual(isValidStatusTransition('submitted', 'under_review'), false);
  assert.strictEqual(isValidStatusTransition('resolved', 'submitted'), false);
  assert.strictEqual(isValidStatusTransition('rejected', 'resolved'), false);
});

test('DB Layer: demo user profiles contain valid deterministic UUIDs', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  assert.ok(uuidRegex.test(DEMO_USER_IDS.citizen));
  assert.ok(uuidRegex.test(DEMO_USER_IDS.worker));
  assert.ok(uuidRegex.test(DEMO_USER_IDS.officer));

  assert.strictEqual(DEMO_PROFILES.citizen.dbUserId, DEMO_USER_IDS.citizen);
  assert.strictEqual(DEMO_PROFILES.worker.dbUserId, DEMO_USER_IDS.worker);
  assert.strictEqual(DEMO_PROFILES.officer.dbUserId, DEMO_USER_IDS.officer);
});
