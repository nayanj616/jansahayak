import 'server-only';
import { getDb } from './client';
import { recordHistory } from './history';
import type {
  ComplaintRecord,
  ComplaintStatus,
  ComplaintWithDetails,
} from '@/types';
import type { CreateComplaintInput } from '@/lib/validation/complaints';

/**
 * Valid state transitions for the complaints lifecycle.
 */
export const VALID_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  submitted: ['assigned', 'rejected'],
  assigned: ['in_progress', 'assigned', 'rejected'],
  in_progress: ['under_review', 'assigned', 'rejected'],
  under_review: ['resolved', 'rework_required', 'rejected'],
  rework_required: ['in_progress', 'assigned', 'rejected'],
  resolved: [], // Terminal approved state
  rejected: [], // Terminal rejected state
};

/**
 * Generates a standard sequential/timestamped complaint code e.g. GWL-2026-XXXX.
 */
export function generateComplaintCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GWL-${year}-${randomSuffix}`;
}

/**
 * Validates whether a status transition is permitted by the state machine.
 */
export function isValidStatusTransition(
  currentStatus: ComplaintStatus,
  targetStatus: ComplaintStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

/**
 * Creates a new complaint and logs its initial submission event into `complaint_history`.
 */
export async function createComplaint(
  input: CreateComplaintInput,
  reporterId: string
): Promise<ComplaintRecord> {
  const db = getDb();
  const complaintCode = generateComplaintCode();

  const insertPayload = {
    complaint_code: complaintCode,
    reporter_id: reporterId,
    ward_id: input.ward_id,
    category: input.category,
    description: input.description || null,
    priority: input.priority || 'normal',
    location_description: input.location_description || null,
    latitude: input.latitude || null,
    longitude: input.longitude || null,
    location_accuracy_m: input.location_accuracy_m || null,
    location_source: input.location_source || (input.latitude ? 'gps' : 'manual'),
    status: 'submitted',
  };

  const { data, error } = await db
    .from('complaints')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to create complaint: ${error?.message}`);
  }

  const createdComplaint = data as ComplaintRecord;

  // Record initial history event
  try {
    await recordHistory({
      complaint_id: createdComplaint.id,
      actor_id: reporterId,
      old_status: null,
      new_status: 'submitted',
      action: 'submitted',
      remarks: 'Initial complaint filed by citizen',
    });
  } catch (histError) {
    console.error(
      `[CRITICAL_AUDIT_FAILURE] Failed to record initial history for complaint ${createdComplaint.id}:`,
      histError
    );
    // Delete un-audited complaint row to maintain audit consistency
    await db.from('complaints').delete().eq('id', createdComplaint.id);
    throw new Error(
      `Failed to record initial complaint audit history: ${histError instanceof Error ? histError.message : String(histError)}`
    );
  }

  return createdComplaint;
}

/**
 * Normalizes the assignments array returned from Supabase PostgREST join.
 *
 * Selection semantics:
 * 1. Prefer 'in_progress' (work actively executing in the field).
 * 2. Otherwise prefer 'assigned' (dispatched work pending start).
 * 3. Otherwise return the most recent historical assignment (e.g. 'completed' for 'under_review' complaints, or 'cancelled').
 * 4. Return null when there are no assignments (empty array).
 *
 * Sets `current_or_latest_assignment` as the primary property, and mirrors to `active_assignment`
 * for backward compatibility across all consumers.
 */
export function normalizeActiveAssignment<
  T extends {
    current_or_latest_assignment?: unknown;
    active_assignment?: unknown;
  }
>(
  complaint: T
): T & {
  current_or_latest_assignment: unknown;
  active_assignment: unknown;
} {
  if (!complaint) return complaint;

  const rawList =
    (Array.isArray(complaint.current_or_latest_assignment)
      ? complaint.current_or_latest_assignment
      : null) ||
    (Array.isArray(complaint.active_assignment)
      ? complaint.active_assignment
      : null);

  let resolved: unknown = null;

  if (rawList && rawList.length > 0) {
    const list = rawList as Array<{ status: string; [key: string]: unknown }>;
    resolved =
      list.find((a) => a.status === 'in_progress') ||
      list.find((a) => a.status === 'assigned') ||
      list[list.length - 1] ||
      null;
  } else if (
    complaint.current_or_latest_assignment &&
    !Array.isArray(complaint.current_or_latest_assignment)
  ) {
    resolved = complaint.current_or_latest_assignment;
  } else if (
    complaint.active_assignment &&
    !Array.isArray(complaint.active_assignment)
  ) {
    resolved = complaint.active_assignment;
  }

  return {
    ...complaint,
    current_or_latest_assignment: resolved,
    active_assignment: resolved,
  };
}

/**
 * Retrieves a single complaint by UUID with joined ward and image relations.
 */
export async function getComplaintById(
  id: string
): Promise<ComplaintWithDetails | null> {
  const db = getDb();

  const { data, error } = await db
    .from('complaints')
    .select(
      `
      *,
      ward:wards(*),
      reporter:demo_users!complaints_reporter_id_fkey(*),
      images:complaint_images(*),
      current_or_latest_assignment:assignments(*, worker:demo_users!assignments_worker_id_fkey(*)),
      ai_verification:ai_verifications(*),
      history:complaint_history(*)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return normalizeActiveAssignment(data as unknown as ComplaintWithDetails);
}

export interface ComplaintFilterOptions {
  status?: ComplaintStatus | ComplaintStatus[];
  reporterId?: string;
  wardId?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Retrieves a list of complaints matching filter criteria.
 */
export async function getComplaints(
  options: ComplaintFilterOptions = {}
): Promise<ComplaintRecord[]> {
  const db = getDb();
  let query = db
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }

  if (options.reporterId) {
    query = query.eq('reporter_id', options.reporterId);
  }

  if (options.wardId) {
    query = query.eq('ward_id', options.wardId);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to query complaints: ${error.message}`);
  }

  return (data || []) as ComplaintRecord[];
}

/**
 * Retrieves a list of complaints with joined ward, images, and history details.
 */
export async function getComplaintsWithDetails(
  options: ComplaintFilterOptions = {}
): Promise<ComplaintWithDetails[]> {
  const db = getDb();
  let query = db
    .from('complaints')
    .select(
      `
      *,
      ward:wards(*),
      reporter:demo_users!complaints_reporter_id_fkey(*),
      images:complaint_images(*),
      current_or_latest_assignment:assignments(*, worker:demo_users!assignments_worker_id_fkey(*)),
      ai_verification:ai_verifications(*),
      history:complaint_history(*)
    `
    )
    .order('created_at', { ascending: false });

  if (options.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }

  if (options.reporterId) {
    query = query.eq('reporter_id', options.reporterId);
  }

  if (options.wardId) {
    query = query.eq('ward_id', options.wardId);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to query complaints with details: ${error.message}`);
  }

  return ((data || []) as unknown as ComplaintWithDetails[]).map(normalizeActiveAssignment);
}

/**
 * Updates a complaint's status with state machine enforcement and audit logging.
 */
export async function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  actorId: string,
  action: string,
  remarks?: string | null
): Promise<ComplaintRecord> {
  const db = getDb();

  // Retrieve current status to validate transition
  const { data: current, error: fetchError } = await db
    .from('complaints')
    .select('status')
    .eq('id', complaintId)
    .single();

  if (fetchError || !current) {
    throw new Error(`[JanSahayak DB] Complaint ${complaintId} not found.`);
  }

  const oldStatus = current.status as ComplaintStatus;

  if (!isValidStatusTransition(oldStatus, newStatus)) {
    throw new Error(
      `[JanSahayak DB] Invalid status transition from '${oldStatus}' to '${newStatus}'. Allowed targets: [${(VALID_STATUS_TRANSITIONS[oldStatus] || []).join(', ')}]`
    );
  }

  const { data: updated, error: updateError } = await db
    .from('complaints')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', complaintId)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw new Error(`[JanSahayak DB] Failed to update complaint status: ${updateError?.message}`);
  }

  // Audit history logging
  await recordHistory({
    complaint_id: complaintId,
    actor_id: actorId,
    old_status: oldStatus,
    new_status: newStatus,
    action,
    remarks: remarks || null,
  });

  return updated as ComplaintRecord;
}
