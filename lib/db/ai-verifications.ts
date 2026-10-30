import 'server-only';
import { getDb } from './client';
import { updateComplaintStatus } from './complaints';
import type {
  AiProcessingStatus,
  AiVerificationRecord,
  HumanReviewStatus,
} from '@/types';

export interface CreateAiVerificationParams {
  complaint_id: string;
  before_image_id?: string | null;
  after_image_id?: string | null;
  processing_status: AiProcessingStatus;
  model_name?: string | null;
  model_version?: string | null;
  metrics?: Record<string, unknown> | null;
  waste_reduction_percentage?: number | null;
  processing_error?: string | null;
  processed_at?: string | null;
  human_review_status?: HumanReviewStatus;
}

/**
 * Inserts or updates an AI verification result row in `ai_verifications`.
 */
export async function createAiVerificationRecord(
  params: CreateAiVerificationParams
): Promise<AiVerificationRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('ai_verifications')
    .insert({
      complaint_id: params.complaint_id,
      before_image_id: params.before_image_id || null,
      after_image_id: params.after_image_id || null,
      processing_status: params.processing_status,
      model_name: params.model_name || null,
      model_version: params.model_version || null,
      metrics: params.metrics || null,
      waste_reduction_percentage: params.waste_reduction_percentage ?? null,
      processing_error: params.processing_error || null,
      processed_at: params.processed_at || new Date().toISOString(),
      human_review_status: params.human_review_status || 'pending',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to create AI verification record: ${error?.message}`);
  }

  return data as AiVerificationRecord;
}

/**
 * Retrieves the latest AI verification for a complaint.
 */
export async function getAiVerificationByComplaint(
  complaintId: string
): Promise<AiVerificationRecord | null> {
  const db = getDb();

  const { data, error } = await db
    .from('ai_verifications')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AiVerificationRecord;
}

/**
 * Updates officer human review on the AI verification record and synchronizes
 * the complaint status to 'resolved', 'rework_required', or 'rejected'.
 */
export async function updateHumanReview(
  verificationId: string,
  complaintId: string,
  humanReviewStatus: 'approved' | 'rejected' | 'rework_required',
  reviewedBy: string,
  remarks?: string | null
): Promise<AiVerificationRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('ai_verifications')
    .update({
      human_review_status: humanReviewStatus,
      reviewed_by: reviewedBy,
      review_remarks: remarks || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to update human review: ${error?.message}`);
  }

  // Synchronize complaint status
  const targetComplaintStatus =
    humanReviewStatus === 'approved'
      ? 'resolved'
      : humanReviewStatus === 'rework_required'
        ? 'rework_required'
        : 'rejected';

  await updateComplaintStatus(
    complaintId,
    targetComplaintStatus,
    reviewedBy,
    `officer_${humanReviewStatus}`,
    remarks || `Officer marked review as ${humanReviewStatus}`
  );

  return data as AiVerificationRecord;
}

