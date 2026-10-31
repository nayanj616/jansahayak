import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { recordComplaintImage } from '@/lib/db/images';
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_STORAGE_BUCKETS,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/validation/storage';
import type {
  AssignmentWithDetails,
  ComplaintImageRecord,
  ImageType,
  StorageBucket,
} from '@/types';

export interface StorageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file MIME type and maximum size restrictions.
 */
export function validateFileBuffer(
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): StorageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Invalid content type '${contentType}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(fileBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 8 MB`,
    };
  }

  return { valid: true };
}

/**
 * Generates a clean, deterministic, collision-resistant storage path.
 */
export function generateObjectPath(
  complaintId: string,
  imageType: ImageType,
  originalFilename: string
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';

  return `${complaintId}/${imageType}_${timestamp}_${randomSuffix}.${cleanExt}`;
}

/**
 * Uploads a file buffer directly to a private Supabase Storage bucket.
 */
export async function uploadToStorage(
  bucket: StorageBucket,
  objectPath: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<{ path: string }> {
  const validation = validateFileBuffer(fileBuffer, contentType);
  if (!validation.valid) {
    throw new Error(`[JanSahayak Storage] Validation error: ${validation.error}`);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error || !data) {
    throw new Error(`[JanSahayak Storage] Upload failed for bucket '${bucket}': ${error?.message}`);
  }

  return { path: data.path };
}

/**
 * Generates a time-limited signed URL for viewing private bucket objects.
 */
export async function getSignedImageUrl(
  bucket: StorageBucket,
  objectPath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(
      `[JanSahayak Storage] Failed to generate signed URL for '${bucket}/${objectPath}': ${error?.message}`
    );
  }

  return data.signedUrl;
}

/**
 * Safely deletes an object from storage (used during rollbacks).
 */
export async function deleteStorageObject(
  bucket: StorageBucket,
  objectPath: string
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.storage.from(bucket).remove([objectPath]);
}

export interface UploadAndLinkParams {
  complaintId: string;
  imageType: ImageType;
  bucket: StorageBucket;
  fileBuffer: Buffer | Uint8Array;
  contentType: string;
  originalFilename: string;
  uploadedBy?: string | null;
}

/**
 * Composite transactional helper:
 * 1. Uploads file to the designated private Storage bucket.
 * 2. Links the uploaded object in the `complaint_images` database table.
 * 3. If database insert fails, rolls back by deleting the uploaded storage object safely.
 */
export async function uploadAndLinkComplaintImage(
  params: UploadAndLinkParams
): Promise<{
  imageRecord: ComplaintImageRecord;
  signedUrl: string;
}> {
  const objectPath = generateObjectPath(
    params.complaintId,
    params.imageType,
    params.originalFilename
  );

  // 1. Upload to storage
  await uploadToStorage(params.bucket, objectPath, params.fileBuffer, params.contentType);

  // 2. Link in complaint_images
  let imageRecord: ComplaintImageRecord;
  try {
    imageRecord = await recordComplaintImage({
      complaint_id: params.complaintId,
      image_type: params.imageType,
      bucket_name: params.bucket,
      object_path: objectPath,
      content_type: params.contentType,
      file_size_bytes: params.fileBuffer.byteLength,
      uploaded_by: params.uploadedBy || null,
    });
  } catch (dbError) {
    // Rollback storage upload on database failure
    console.error(
      `[JanSahayak Storage] DB insert failed. Rolling back storage object '${params.bucket}/${objectPath}'...`
    );
    try {
      await deleteStorageObject(params.bucket, objectPath);
    } catch (cleanupError) {
      console.error('[JanSahayak Storage] Rollback cleanup error:', cleanupError);
    }
    throw dbError;
  }

  // 3. Generate initial signed preview URL
  const signedUrl = await getSignedImageUrl(params.bucket, objectPath, 3600);

  return { imageRecord, signedUrl };
}

/**
 * Diagnostic helper verifying that the four expected private buckets are operational.
 */
export async function verifyStorageBuckets(): Promise<
  Record<StorageBucket, { exists: boolean; isPublic: boolean }>
> {
  const supabase = getSupabaseAdminClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error || !buckets) {
    throw new Error(`[JanSahayak Storage] Failed to list buckets: ${error?.message}`);
  }

  const result: Record<StorageBucket, { exists: boolean; isPublic: boolean }> = {
    'complaint-originals': { exists: false, isPublic: false },
    'cleanup-evidence': { exists: false, isPublic: false },
    'ai-annotated': { exists: false, isPublic: false },
    'verification-comparisons': { exists: false, isPublic: false },
  };

  for (const bucketName of ALLOWED_STORAGE_BUCKETS) {
    const found = buckets.find((b) => b.name === bucketName || b.id === bucketName);
    if (found) {
      result[bucketName] = { exists: true, isPublic: found.public };
    }
  }

  return result;
}

/**
 * Attaches fresh time-limited private signed URLs to all image records
 * of a complaint with details.
 */
export async function attachSignedUrlsToComplaint<
  T extends { images?: ComplaintImageRecord[] }
>(complaint: T): Promise<T> {
  if (!complaint.images || complaint.images.length === 0) {
    return complaint;
  }

  const enrichedImages = await Promise.all(
    complaint.images.map(async (img) => {
      try {
        const signedUrl = await getSignedImageUrl(img.bucket_name, img.object_path, 3600);
        return { ...img, signed_url: signedUrl };
      } catch (err) {
        console.error(`[JanSahayak Storage] Failed to get signed URL for ${img.object_path}:`, err);
        return img;
      }
    })
  );

  return { ...complaint, images: enrichedImages };
}

/**
 * Attaches fresh private signed URLs to an array of complaints.
 */
export async function attachSignedUrlsToComplaints<
  T extends { images?: ComplaintImageRecord[] }
>(complaints: T[]): Promise<T[]> {
  return Promise.all(complaints.map(attachSignedUrlsToComplaint));
}

/**
 * Attaches fresh private signed URLs to complaint images within an assignment.
 */
export async function attachSignedUrlsToAssignment(
  assignment: AssignmentWithDetails
): Promise<AssignmentWithDetails> {
  if (assignment.complaint) {
    const enrichedComplaint = await attachSignedUrlsToComplaint(assignment.complaint);
    return { ...assignment, complaint: enrichedComplaint };
  }
  return assignment;
}

/**
 * Attaches fresh private signed URLs to an array of assignments.
 */
export async function attachSignedUrlsToAssignments(
  assignments: AssignmentWithDetails[]
): Promise<AssignmentWithDetails[]> {
  return Promise.all(assignments.map(attachSignedUrlsToAssignment));
}

