import 'server-only';
import { getDb } from './client';
import { updateComplaintStatus } from './complaints';
import type { AssignmentRecord, AssignmentStatus } from '@/types';

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

