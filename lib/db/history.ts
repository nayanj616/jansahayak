import 'server-only';
import { getDb } from './client';
import type { ComplaintHistoryRecord } from '@/types';

export interface RecordHistoryParams {
  complaint_id: string;
  actor_id: string | null;
  old_status?: string | null;
  new_status?: string | null;
  action: string;
  remarks?: string | null;
}

/**
 * Inserts an audit event into `complaint_history`.
 */
export async function recordHistory(
  params: RecordHistoryParams
): Promise<ComplaintHistoryRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('complaint_history')
    .insert({
      complaint_id: params.complaint_id,
      actor_id: params.actor_id,
      old_status: params.old_status || null,
      new_status: params.new_status || null,
      action: params.action,
      remarks: params.remarks || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to record history: ${error?.message}`);
  }

  return data as ComplaintHistoryRecord;
}

/**
 * Retrieves the full chronological audit history for a complaint.
 */
export async function getHistoryByComplaint(
  complaintId: string
): Promise<ComplaintHistoryRecord[]> {
  const db = getDb();

  const { data, error } = await db
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to fetch complaint history: ${error.message}`);
  }

  return (data || []) as ComplaintHistoryRecord[];
}

