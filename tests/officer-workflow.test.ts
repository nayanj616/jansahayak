import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  assignComplaintSchema,
  officerReviewComplaintSchema,
} from '../lib/validation/complaints';
import { requireApiRole } from '../lib/auth/api-guards';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '../lib/auth/tokens';
import {
  isValidStatusTransition,
  normalizeActiveAssignment,
} from '../lib/db/complaints';
import {
  isAssignableComplaintStatus,
  ASSIGNABLE_COMPLAINT_STATUSES,
} from '../lib/db/assignments';
import { ALLOWED_STORAGE_BUCKETS } from '../lib/validation/storage';
import type { ComplaintStatus, DemoUserRecord } from '../types';

async function createAuthRequest(
  role: 'citizen' | 'worker' | 'officer',
  url: string = 'http://localhost:3000/api/assignments'
): Promise<NextRequest> {
  const token = await createDemoToken(DEMO_PROFILES[role]);
  const headers = new Headers();
  headers.set('cookie', `${DEMO_COOKIE_NAME}=${token}`);
  return new NextRequest(url, { headers });
}

function createUnauthRequest(url: string = 'http://localhost:3000/api/assignments'): NextRequest {
  const headers = new Headers();
  return new NextRequest(url, { headers });
}

// ============================================================================
// 1. ZOD VALIDATION SCHEMAS
// ============================================================================

test('Officer Workflow: accepts valid worker assignment payload', () => {
  const valid = assignComplaintSchema.safeParse({
    complaint_id: 'a1111111-1111-4000-8000-111111111111',
    worker_id: 'b1111111-1111-4000-8000-111111111111',
    notes: 'Please clear blocked drain near main market entrance.',
  });

  assert.ok(valid.success);
  if (valid.success) {
    assert.strictEqual(valid.data.complaint_id, 'a1111111-1111-4000-8000-111111111111');
    assert.strictEqual(valid.data.worker_id, 'b1111111-1111-4000-8000-111111111111');
    assert.strictEqual(valid.data.notes, 'Please clear blocked drain near main market entrance.');
  }
});

test('Officer Workflow: rejects assignment with invalid UUID format', () => {
  const invalid = assignComplaintSchema.safeParse({
    complaint_id: 'not-a-valid-uuid',
    worker_id: 'also-invalid',
  });

  assert.strictEqual(invalid.success, false);
});

test('Officer Workflow: accepts valid officer review payload for all 3 actions', () => {
  const approve = officerReviewComplaintSchema.safeParse({
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    action: 'approve',
    remarks: 'Field cleanup inspected and approved. Site is sanitized.',
  });
  assert.ok(approve.success);

  const rework = officerReviewComplaintSchema.safeParse({
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    action: 'rework',
    remarks: 'Residual debris left along pavement curb. Re-sweep required.',
  });
  assert.ok(rework.success);

  const reject = officerReviewComplaintSchema.safeParse({
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    action: 'reject',
    remarks: 'Grievance out of scope for municipal solid waste management.',
  });
  assert.ok(reject.success);
});

test('Officer Workflow: rejects officer review with empty remarks', () => {
  const emptyRemarks = officerReviewComplaintSchema.safeParse({
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    action: 'approve',
    remarks: '',
  });

  assert.strictEqual(emptyRemarks.success, false);
});

test('Officer Workflow: rejects officer review with unapproved action', () => {
  const invalidAction = officerReviewComplaintSchema.safeParse({
    complaint_id: 'c1111111-1111-4000-8000-111111111111',
    action: 'delete',
    remarks: 'Attempt to delete complaint',
  });

  assert.strictEqual(invalidAction.success, false);
});

// ============================================================================
// 2. AUTHORIZATION GUARDS & ROLE ISOLATION
// ============================================================================

test('Officer Workflow: rejects unauthenticated requests with 401', async () => {
  const req = createUnauthRequest();
  const auth = await requireApiRole('officer', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response?.status, 401);
});

test('Officer Workflow: rejects citizen role with 403 Forbidden', async () => {
  const req = await createAuthRequest('citizen');
  const auth = await requireApiRole('officer', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response?.status, 403);
});

test('Officer Workflow: rejects worker role with 403 Forbidden', async () => {
  const req = await createAuthRequest('worker');
  const auth = await requireApiRole('officer', req);

  assert.ok(auth.response);
  assert.strictEqual(auth.response?.status, 403);
});

test('Officer Workflow: authorizes valid officer session', async () => {
  const req = await createAuthRequest('officer');
  const auth = await requireApiRole('officer', req);

  assert.strictEqual(auth.response, undefined);
  assert.strictEqual(auth.session.user.role, 'officer');
});

// ============================================================================
// 3. STATE MACHINE TRANSITIONS & REVIEW INTEGRITY
// ============================================================================

test('Officer Workflow: validates permissible transitions from under_review', () => {
  // Officer review actions
  assert.strictEqual(isValidStatusTransition('under_review', 'resolved'), true);
  assert.strictEqual(isValidStatusTransition('under_review', 'rework_required'), true);
  assert.strictEqual(isValidStatusTransition('under_review', 'rejected'), true);

  // Invalid direct transitions from under_review
  assert.strictEqual(isValidStatusTransition('under_review', 'in_progress'), false);
  assert.strictEqual(isValidStatusTransition('under_review', 'submitted'), false);
});

test('Officer Workflow: validates terminal states cannot transition to other states', () => {
  const terminalResolvedTargets: ComplaintStatus[] = [
    'submitted',
    'assigned',
    'in_progress',
    'under_review',
    'rework_required',
    'rejected',
  ];

  for (const target of terminalResolvedTargets) {
    assert.strictEqual(
      isValidStatusTransition('resolved', target),
      false,
      `resolved must not transition to ${target}`
    );
  }

  const terminalRejectedTargets: ComplaintStatus[] = [
    'submitted',
    'assigned',
    'in_progress',
    'under_review',
    'rework_required',
    'resolved',
  ];

  for (const target of terminalRejectedTargets) {
    assert.strictEqual(
      isValidStatusTransition('rejected', target),
      false,
      `rejected must not transition to ${target}`
    );
  }
});

// ============================================================================
// 4. ASSIGNMENT & REASSIGNMENT ELIGIBILITY
// ============================================================================

test('Officer Workflow: permits assignment only from assignable statuses', () => {
  assert.strictEqual(isAssignableComplaintStatus('submitted'), true);
  assert.strictEqual(isAssignableComplaintStatus('assigned'), true);
  assert.strictEqual(isAssignableComplaintStatus('rework_required'), true);

  assert.strictEqual(isAssignableComplaintStatus('under_review'), false);
  assert.strictEqual(isAssignableComplaintStatus('in_progress'), false);
  assert.strictEqual(isAssignableComplaintStatus('resolved'), false);
  assert.strictEqual(isAssignableComplaintStatus('rejected'), false);
});

test('Officer Workflow: assignable statuses match approved design specification', () => {
  const expected: ComplaintStatus[] = ['submitted', 'assigned', 'rework_required'];
  assert.deepStrictEqual([...ASSIGNABLE_COMPLAINT_STATUSES].sort(), [...expected].sort());
});

// ============================================================================
// 5. POSTGREST RELATION NORMALIZATION
// ============================================================================

test('Officer Workflow: normalizeActiveAssignment prioritizes in_progress over completed and assigned', () => {
  const mockWorker: DemoUserRecord = {
    id: 'b1111111-1111-4000-8000-111111111111',
    display_name: 'Rajesh Kumar',
    role: 'worker',
    ward_id: 'GWL-W-012',
    is_active: true,
    created_at: '2026-10-31T00:00:00Z',
    updated_at: '2026-10-31T00:00:00Z',
  };

  const rawComplaint = {
    id: 'c1111111-1111-4000-8000-111111111111',
    complaint_code: 'GWL-2026-1076',
    active_assignment: [
      { id: 'a1', status: 'completed', worker: mockWorker },
      { id: 'a2', status: 'in_progress', worker: mockWorker },
    ],
  };

  const normalized = normalizeActiveAssignment(rawComplaint);
  const active = normalized.current_or_latest_assignment as unknown as { id: string; status: string };
  const legacy = normalized.active_assignment as unknown as { id: string; status: string };
  assert.ok(active);
  assert.strictEqual(active.id, 'a2');
  assert.strictEqual(active.status, 'in_progress');
  assert.strictEqual(legacy.id, 'a2');
});

test('Officer Workflow: normalizeActiveAssignment prefers assigned over historical and returns latest historical if no active', () => {
  const rawWithAssigned = {
    id: 'c1',
    active_assignment: [
      { id: 'a1', status: 'cancelled' },
      { id: 'a2', status: 'assigned' },
    ],
  };
  const normalized1 = normalizeActiveAssignment(rawWithAssigned);
  const res1 = normalized1.current_or_latest_assignment as unknown as { id: string };
  assert.strictEqual(res1.id, 'a2');

  const rawHistoricalOnly = {
    id: 'c2',
    current_or_latest_assignment: [
      { id: 'a1', status: 'cancelled' },
      { id: 'a2', status: 'completed' },
    ],
  };
  const normalized2 = normalizeActiveAssignment(rawHistoricalOnly);
  const res2 = normalized2.current_or_latest_assignment as unknown as { id: string };
  assert.strictEqual(res2.id, 'a2');
  assert.strictEqual((normalized2.active_assignment as unknown as { id: string }).id, 'a2');
});

test('Officer Workflow: normalizeActiveAssignment returns null when assignments list is empty', () => {
  const rawEmpty = {
    id: 'c3',
    current_or_latest_assignment: [],
  };
  const normalized = normalizeActiveAssignment(rawEmpty);
  assert.strictEqual(normalized.current_or_latest_assignment, null);
  assert.strictEqual(normalized.active_assignment, null);
});

test('Officer Workflow: normalizeActiveAssignment preserves single object if already normalized', () => {
  const alreadySingle = {
    id: 'c1111111-1111-4000-8000-111111111111',
    current_or_latest_assignment: { id: 'a1', status: 'assigned' },
  };

  const normalized = normalizeActiveAssignment(alreadySingle);
  assert.deepStrictEqual(normalized.current_or_latest_assignment, { id: 'a1', status: 'assigned' });
  assert.deepStrictEqual(normalized.active_assignment, { id: 'a1', status: 'assigned' });
});

// ============================================================================
// 6. PRIVATE STORAGE ACCESS & BUCKET PERMISSIONS
// ============================================================================

test('Officer Workflow: recognizes required private buckets for dual photo inspection', () => {
  assert.ok(ALLOWED_STORAGE_BUCKETS.includes('complaint-originals'));
  assert.ok(ALLOWED_STORAGE_BUCKETS.includes('cleanup-evidence'));
});
