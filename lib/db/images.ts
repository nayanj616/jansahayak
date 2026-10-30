import 'server-only';
import { getDb } from './client';
import type { ComplaintImageRecord, ImageType, StorageBucket } from '@/types';

export interface RecordComplaintImageParams {
  complaint_id: string;
  image_type: ImageType;
  bucket_name: StorageBucket;
  object_path: string;
  content_type?: string | null;
  file_size_bytes?: number | null;
  uploaded_by?: string | null;
}

/**
 * Inserts a metadata row into `complaint_images` linking an uploaded storage object
 * to its corresponding complaint.
 */
export async function recordComplaintImage(
  params: RecordComplaintImageParams
): Promise<ComplaintImageRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('complaint_images')
    .insert({
      complaint_id: params.complaint_id,
      image_type: params.image_type,
      bucket_name: params.bucket_name,
      object_path: params.object_path,
      content_type: params.content_type || 'image/jpeg',
      file_size_bytes: params.file_size_bytes || null,
      uploaded_by: params.uploaded_by || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to record complaint image: ${error?.message}`);
  }

  return data as ComplaintImageRecord;
}

/**
 * Retrieves all image records associated with a complaint.
 */
export async function getImagesByComplaintId(
  complaintId: string
): Promise<ComplaintImageRecord[]> {
  const db = getDb();

  const { data, error } = await db
    .from('complaint_images')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to fetch complaint images: ${error.message}`);
  }

  return (data || []) as ComplaintImageRecord[];
}

/**
 * Deletes a complaint image metadata row (used during rollback).
 */
export async function deleteComplaintImageRecord(id: string): Promise<void> {
  const db = getDb();
  await db.from('complaint_images').delete().eq('id', id);
}

