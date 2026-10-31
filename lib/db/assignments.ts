import 'server-only';
import { getDb } from './client';
import { updateComplaintStatus } from './complaints';
import type {
  AssignmentRecord,
  AssignmentStatus,
  AssignmentWithDetails,
} from '@/types';

/**
 * Creates an assignment allocating a complaint to a sanitation worker.
 * Also updates the complaint status to 'assigned'.
 */
export async function createAssignment(
  complaintId: string,
  workerId: string,
  assignedBy: string,
  notes?: string | null
): Promise<AssignmentRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('assignments')
    .insert({
      complaint_id: complaintId,
      worker_id: workerId,
      assigned_by: assignedBy,
      status: 'assigned',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to create assignment: ${error?.message}`);
  }

  // Update complaint status to 'assigned'
  try {
    await updateComplaintStatus(
      complaintId,
      'assigned',
      assignedBy,
      'assigned',
      notes || 'Task dispatched to sanitation field worker'
    );
  } catch (compError) {
    console.error('[JanSahayak DB] Complaint status update error:', compError);
  }

  return data as AssignmentRecord;
}

/**
 * Retrieves assignments for a specific worker, optionally filtered by status.
 */
export async function getAssignmentsByWorker(
  workerId: string,
  status?: AssignmentStatus | AssignmentStatus[]
): Promise<AssignmentRecord[]> {
  const db = getDb();

  let query = db
    .from('assignments')
    .select('*, complaint:complaints(*)')
    .eq('worker_id', workerId)
    .order('assigned_at', { ascending: false });

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to query worker assignments: ${error.message}`);
  }

  return (data || []) as AssignmentRecord[];
}

/**
 * Retrieves assignments for a specific worker with full joined complaint,
 * ward, and images details.
 */
export async function getWorkerAssignments(
  workerId: string,
  status?: AssignmentStatus | AssignmentStatus[]
): Promise<AssignmentWithDetails[]> {
  const db = getDb();

  let query = db
    .from('assignments')
    .select(`
      *,
      complaint:complaints(
        *,
        ward:wards(*),
        images:complaint_images(*)
      )
    `)
    .eq('worker_id', workerId)
    .order('assigned_at', { ascending: false });

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to query worker assignments: ${error.message}`);
  }

  return (data || []) as unknown as AssignmentWithDetails[];
}

/**
 * Retrieves a single assignment with full joined complaint, ward, and images.
 */
export async function getAssignmentWithDetails(
  assignmentId: string
): Promise<AssignmentWithDetails | null> {
  const db = getDb();

  const { data, error } = await db
    .from('assignments')
    .select(`
      *,
      complaint:complaints(
        *,
        ward:wards(*),
        images:complaint_images(*)
      )
    `)
    .eq('id', assignmentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as AssignmentWithDetails;
}

/**
 * Updates assignment status and sets relevant timestamps (started_at, completed_at).
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  newStatus: AssignmentStatus
): Promise<AssignmentRecord> {
  const db = getDb();

  const patch: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'in_progress') {
    patch.started_at = new Date().toISOString();
  } else if (newStatus === 'completed') {
    patch.completed_at = new Date().toISOString();
  }

  const { data, error } = await db
    .from('assignments')
    .update(patch)
    .eq('id', assignmentId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to update assignment status: ${error?.message}`);
  }

  return data as AssignmentRecord;
}

/**
 * Sanitation Worker Action: Accept and start an assigned cleanup task.
 * Transitions assignment to 'in_progress' and complaint to 'in_progress'.
 * Emits audit log to complaint_history.
 */
export async function startAssignmentTask(
  assignmentId: string,
  workerId: string
): Promise<AssignmentWithDetails> {
  const db = getDb();

  const assignment = await getAssignmentWithDetails(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment '${assignmentId}' not found.`);
  }

  // Cross-worker isolation enforcement
  if (assignment.worker_id !== workerId) {
    throw new Error(`Forbidden: Assignment '${assignmentId}' is not allocated to this worker.`);
  }

  if (assignment.status === 'completed') {
    throw new Error(`Cannot start assignment '${assignmentId}' because it has already been completed.`);
  }

  if (assignment.status === 'cancelled') {
    throw new Error(`Cannot start assignment '${assignmentId}' because it was cancelled.`);
  }

  // If already in_progress, return assignment idempotently
  if (assignment.status === 'in_progress') {
    return assignment;
  }

  if (assignment.status !== 'assigned') {
    throw new Error(`Task must be in 'assigned' status to start. Current status is '${assignment.status}'.`);
  }

  // Update assignment status to in_progress
  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from('assignments')
    .update({
      status: 'in_progress',
      started_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId);

  if (updateErr) {
    throw new Error(`[JanSahayak DB] Failed to start assignment: ${updateErr.message}`);
  }

  // Update complaint status to in_progress and record history
  await updateComplaintStatus(
    assignment.complaint_id,
    'in_progress',
    workerId,
    'work_started',
    'Sanitation worker accepted and started cleanup task.'
  );

  const updatedAssignment = await getAssignmentWithDetails(assignmentId);
  return updatedAssignment!;
}

/**
 * Sanitation Worker Action: Mark task as completed after uploading cleanup evidence.
 * Transitions assignment to 'completed' and complaint to 'under_review'.
 * Mandatory: requires at least one 'after' image in complaint_images.
 * Emits audit log to complaint_history.
 */
export async function completeAssignmentTask(
  assignmentId: string,
  workerId: string,
  remarks?: string | null
): Promise<AssignmentWithDetails> {
  const db = getDb();

  const assignment = await getAssignmentWithDetails(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment '${assignmentId}' not found.`);
  }

  // Cross-worker isolation enforcement
  if (assignment.worker_id !== workerId) {
    throw new Error(`Forbidden: Assignment '${assignmentId}' is not allocated to this worker.`);
  }

  if (assignment.status === 'completed') {
    throw new Error(`Task has already been marked as completed.`);
  }

  if (assignment.status !== 'in_progress') {
    throw new Error(`Task must be 'in_progress' to complete. Current status is '${assignment.status}'.`);
  }

  // Verify photographic evidence of cleanup exists in complaint_images
  const { data: afterImages, error: imgErr } = await db
    .from('complaint_images')
    .select('id')
    .eq('complaint_id', assignment.complaint_id)
    .eq('image_type', 'after');

  if (imgErr) {
    throw new Error(`[JanSahayak DB] Failed to verify cleanup evidence: ${imgErr.message}`);
  }

  if (!afterImages || afterImages.length === 0) {
    throw new Error(
      `Completion rejected: Photographic evidence of cleanup (after-cleanup photo) is mandatory before marking a task complete.`
    );
  }

  // Update assignment status to completed
  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from('assignments')
    .update({
      status: 'completed',
      completed_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId);

  if (updateErr) {
    throw new Error(`[JanSahayak DB] Failed to complete assignment: ${updateErr.message}`);
  }

  // Update complaint status to under_review and record history
  await updateComplaintStatus(
    assignment.complaint_id,
    'under_review',
    workerId,
    'cleanup_completed',
    remarks || 'Sanitation worker completed cleanup operations and submitted photographic evidence.'
  );

  const updatedAssignment = await getAssignmentWithDetails(assignmentId);
  return updatedAssignment!;
}
