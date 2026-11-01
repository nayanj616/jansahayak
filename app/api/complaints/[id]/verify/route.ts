import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiRole } from '@/lib/auth/api-guards';
import { getComplaintById } from '@/lib/db/complaints';
import {
  getLatestVerificationForImagePair,
  createPendingAiVerificationRecord,
  updateAiVerificationToCompleted,
  updateAiVerificationToFailed,
} from '@/lib/db/ai-verifications';
import { downloadStorageBuffer } from '@/lib/storage';
import { getVisionModel } from '@/lib/gemini/client';
import {
  analyzeCleanliness,
  VISION_PROMPT_VERSION,
  SUPPORTED_VISION_MIME_TYPES,
  type SupportedVisionMimeType,
} from '@/lib/gemini/vision';
import { MAX_FILE_SIZE_BYTES } from '@/lib/validation/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const verifyRequestSchema = z.object({
  force_recheck: z.boolean().optional().default(false),
});

/**
 * POST /api/complaints/[id]/verify
 * Municipal Officer action: Triggers on-demand multimodal AI cleanliness verification
 * on before-and-after photographic evidence.
 *
 * Operational and Ethical Safeguards:
 * 1. Strictly restricted to 'officer' role via requireApiRole('officer').
 * 2. Complaint must be in 'under_review' status.
 * 3. Before and after images are verified as belonging to this specific complaint.
 * 4. Image buffers are downloaded server-to-server from private buckets; no public URLs exposed.
 * 5. Conservative idempotency: returns cached result for matching image pairs unless force_recheck=true.
 * 6. Model findings are advisory observations only. AI never updates complaint status or human review.
 * 7. On model or storage failure, complaint remains safely in 'under_review' and failure is sanitized.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  // 1. Enforce officer authorization boundary
  const auth = await requireApiRole('officer', request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;

  // 2. Validate complaint UUID format
  const uuidParse = z.string().uuid('Invalid complaint ID format').safeParse(id);
  if (!uuidParse.success) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Complaint ID must be a valid UUID' },
      { status: 400 }
    );
  }

  // Parse optional body
  let forceRecheck = false;
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsedBody = verifyRequestSchema.safeParse(rawBody || {});
    if (parsedBody.success) {
      forceRecheck = parsedBody.data.force_recheck;
    }
  } catch {
    forceRecheck = false;
  }

  try {
    // 3. Confirm complaint exists and is under review
    const complaint = await getComplaintById(id);
    if (!complaint) {
      return NextResponse.json(
        { error: 'Not Found', message: `Complaint '${id}' not found.` },
        { status: 404 }
      );
    }

    if (complaint.status !== 'under_review') {
      return NextResponse.json(
        {
          error: 'Invalid complaint status',
          message: `Verification is only permitted for complaints in 'under_review' status. Current status is '${complaint.status}'.`,
        },
        { status: 400 }
      );
    }

    // 4. Retrieve and associate before-and-after photographs
    const images = complaint.images || [];
    const beforeImg = images.find(
      (img) => img.image_type === 'before' || img.image_type === 'original'
    );
    // Prefer the latest 'after' image
    const afterImg = [...images].filter((img) => img.image_type === 'after').pop();

    if (!beforeImg) {
      return NextResponse.json(
        {
          error: 'Missing before photo',
          message: 'The citizen grievance photo (before cleanup) is missing. Cannot perform comparison.',
        },
        { status: 400 }
      );
    }

    if (!afterImg) {
      return NextResponse.json(
        {
          error: 'Missing after photo',
          message: 'Sanitation worker cleanup proof (after photo) is missing. Cannot perform comparison.',
        },
        { status: 400 }
      );
    }

    // Verify ownership and consistency
    if (beforeImg.complaint_id !== id || afterImg.complaint_id !== id) {
      return NextResponse.json(
        {
          error: 'Image association mismatch',
          message: 'Retrieved images do not belong to the requested complaint.',
        },
        { status: 400 }
      );
    }

    // Validate MIME types
    const beforeMime = (beforeImg.content_type || 'image/jpeg').toLowerCase();
    const afterMime = (afterImg.content_type || 'image/jpeg').toLowerCase();

    if (!SUPPORTED_VISION_MIME_TYPES.includes(beforeMime as SupportedVisionMimeType)) {
      return NextResponse.json(
        {
          error: 'Unsupported before image format',
          message: `Before image has unsupported MIME type '${beforeMime}'. Supported types: ${SUPPORTED_VISION_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!SUPPORTED_VISION_MIME_TYPES.includes(afterMime as SupportedVisionMimeType)) {
      return NextResponse.json(
        {
          error: 'Unsupported after image format',
          message: `After image has unsupported MIME type '${afterMime}'. Supported types: ${SUPPORTED_VISION_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file sizes
    if (beforeImg.file_size_bytes && beforeImg.file_size_bytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'Before image exceeds maximum size',
          message: 'Citizen photo exceeds the 8 MB storage size limit.',
        },
        { status: 400 }
      );
    }

    if (afterImg.file_size_bytes && afterImg.file_size_bytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'After image exceeds maximum size',
          message: 'Worker proof photo exceeds the 8 MB storage size limit.',
        },
        { status: 400 }
      );
    }

    // 5. Conservative Idempotency Check for identical image pair
    const existing = await getLatestVerificationForImagePair(id, beforeImg.id, afterImg.id);

    if (existing) {
      if (!forceRecheck && existing.processing_status === 'completed') {
        return NextResponse.json({
          success: true,
          verification: existing,
          cached: true,
          message: 'Returned existing cached verification findings for this image pair.',
        });
      }

      if (existing.processing_status === 'pending') {
        return NextResponse.json(
          {
            error: 'Verification in progress',
            message: 'Verification is currently in progress for this image pair. Please wait a moment.',
            verification: existing,
            pending: true,
          },
          { status: 409 }
        );
      }
    }

    // 6. Record Pending State
    const model = getVisionModel();
    const pendingRecord = await createPendingAiVerificationRecord({
      complaint_id: id,
      before_image_id: beforeImg.id,
      after_image_id: afterImg.id,
      model_name: model,
      model_version: VISION_PROMPT_VERSION,
    });

    // 7. Download private image buffers server-side
    let beforeBuffer: Buffer;
    let afterBuffer: Buffer;

    try {
      beforeBuffer = await downloadStorageBuffer(beforeImg.bucket_name, beforeImg.object_path);
      afterBuffer = await downloadStorageBuffer(afterImg.bucket_name, afterImg.object_path);
    } catch (storageError) {
      console.error('[API /api/complaints/[id]/verify] Storage download error:', storageError);
      const sanitized = 'Failed to retrieve private image storage objects for analysis.';
      const failedRecord = await updateAiVerificationToFailed({
        id: pendingRecord.id,
        processing_error: sanitized,
      });

      return NextResponse.json(
        {
          error: 'Storage retrieval failed',
          message: sanitized,
          verification: failedRecord,
        },
        { status: 502 }
      );
    }

    // 8. Invoke Gemini Vision Analysis
    try {
      const analysis = await analyzeCleanliness(
        { buffer: beforeBuffer, mimeType: beforeMime },
        { buffer: afterBuffer, mimeType: afterMime }
      );

      // 9. Persist Completed Verification Record
      const completedRecord = await updateAiVerificationToCompleted({
        id: pendingRecord.id,
        metrics: analysis.metrics as unknown as Record<string, unknown>,
        waste_reduction_percentage: analysis.metrics.evaluation.wasteReductionEstimate,
      });

      return NextResponse.json({
        success: true,
        verification: completedRecord,
        cached: false,
        message: 'Visual verification completed successfully.',
      });
    } catch (visionError) {
      console.error('[API /api/complaints/[id]/verify] Vision model error:', visionError);
      const sanitized =
        visionError instanceof Error
          ? visionError.message
          : 'Visual verification model processing failed.';

      const failedRecord = await updateAiVerificationToFailed({
        id: pendingRecord.id,
        processing_error: sanitized,
      });

      return NextResponse.json(
        {
          error: 'Vision verification failed',
          message: sanitized,
          verification: failedRecord,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error(`[API /api/complaints/${id}/verify POST] Unexpected error:`, error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    );
  }
}
