import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole, requireApiSession } from '@/lib/auth/api-guards';
import { resolveDemoUserId } from '@/lib/db/users';
import {
  createComplaint,
  getComplaintsWithDetails,
  getComplaintById,
} from '@/lib/db/complaints';
import { getDb } from '@/lib/db/client';
import type { ComplaintStatus } from '@/types';
import {
  attachSignedUrlsToComplaints,
  attachSignedUrlsToComplaint,
  uploadAndLinkComplaintImage,
  validateFileBuffer,
} from '@/lib/storage';
import { createComplaintSchema } from '@/lib/validation/complaints';

/**
 * GET /api/complaints
 * Retrieves complaints with joined ward, images, and history.
 * Strictly enforces ownership: Citizens can ONLY query their own complaints.
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);

  try {
    let reporterIdFilter: string | undefined;

    // Citizens can ONLY see their own reported complaints
    if (session.user.role === 'citizen') {
      reporterIdFilter = session.user.dbUserId || (await resolveDemoUserId('citizen'));
    } else if (session.user.role === 'officer') {
      // Municipal officers can view all or filter by specific reporter
      const requestedReporter = searchParams.get('reporter_id');
      if (requestedReporter) {
        reporterIdFilter = requestedReporter;
      }
    } else {
      // Workers should query via tasks/assignments API
      return NextResponse.json(
        { error: 'Forbidden', message: 'Workers should access tasks via /api/tasks' },
        { status: 403 }
      );
    }

    const wardIdFilter = searchParams.get('ward_id') || undefined;
    const statusFilter = (searchParams.get('status') as ComplaintStatus) || undefined;
    const categoryFilter = searchParams.get('category') || undefined;
    const withSignedUrls = searchParams.get('with_signed_urls') === 'true';

    const complaints = await getComplaintsWithDetails({
      reporterId: reporterIdFilter,
      wardId: wardIdFilter,
      status: statusFilter,
      category: categoryFilter,
    });

    // For citizen: always attach signed URLs (backwards compatibility)
    // For officer: attach signed URLs only if explicitly requested (with_signed_urls=true)
    // to avoid generating signed URLs for every complaint merely to display queue/metrics (Requirement D)
    const enrichedComplaints =
      session.user.role === 'citizen' || withSignedUrls
        ? await attachSignedUrlsToComplaints(complaints)
        : complaints;

    return NextResponse.json({
      success: true,
      count: enrichedComplaints.length,
      complaints: enrichedComplaints,
    });
  } catch (error) {
    console.error('[API /api/complaints GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch complaints',
        details: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/complaints
 * Citizen complaint submission endpoint:
 * 1. Verifies citizen demo role authorization.
 * 2. Validates fields with Zod.
 * 3. Enforces 8MB file size limit & supported image MIME types.
 * 4. Creates complaint row in database (status: 'submitted').
 * 5. Uploads photo to private 'complaint-originals' storage bucket.
 * 6. Links image in `complaint_images` table.
 * 7. On upload failure, performs rollback of database record.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiRole('citizen', request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const formData = await request.formData();

    const file = formData.get('image') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'An original photograph of the sanitation issue is required.',
        },
        { status: 400 }
      );
    }

    // Read file buffer and validate format / size
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);

    const validation = validateFileBuffer(fileBuffer, file.type);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid file upload',
          message: validation.error,
        },
        { status: 400 }
      );
    }

    // Extract form fields
    const category = formData.get('category');
    const priority = formData.get('priority') || 'normal';
    const ward_id = formData.get('ward_id');
    const description = formData.get('description');
    const location_description = formData.get('location_description');
    const latitudeStr = formData.get('latitude');
    const longitudeStr = formData.get('longitude');
    const accuracyStr = formData.get('location_accuracy_m');
    const location_source = formData.get('location_source');

    const latitude = latitudeStr ? parseFloat(latitudeStr as string) : null;
    const longitude = longitudeStr ? parseFloat(longitudeStr as string) : null;
    const location_accuracy_m = accuracyStr ? parseFloat(accuracyStr as string) : null;

    // Validate using Zod schema
    const parsed = createComplaintSchema.safeParse({
      category,
      priority,
      ward_id,
      description: description || null,
      location_description: location_description || null,
      latitude,
      longitude,
      location_accuracy_m,
      location_source: location_source || (latitude ? 'gps' : 'manual'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    // Resolve authenticated reporter ID (Never trust user-supplied ID)
    const reporterId =
      session.user.dbUserId || (await resolveDemoUserId('citizen'));

    // 1. Create complaint record in database (status: 'submitted')
    const createdComplaint = await createComplaint(parsed.data, reporterId);

    // 2. Upload photo to private 'complaint-originals' bucket and link in complaint_images
    try {
      await uploadAndLinkComplaintImage({
        complaintId: createdComplaint.id,
        imageType: 'before',
        bucket: 'complaint-originals',
        fileBuffer,
        contentType: file.type,
        originalFilename: file.name,
        uploadedBy: reporterId,
      });
    } catch (uploadError) {
      console.error(
        '[API /api/complaints POST] Storage upload failed. Rolling back complaint record:',
        uploadError
      );
      // Clean up orphaned complaint record on storage failure
      try {
        const db = getDb();
        const { error: rollbackErr } = await db
          .from('complaints')
          .delete()
          .eq('id', createdComplaint.id);
        if (rollbackErr) {
          console.error(
            `[CRITICAL_ROLLBACK_FAILURE] Failed to delete orphaned complaint ${createdComplaint.id}:`,
            rollbackErr
          );
        }
      } catch (rbErr) {
        console.error(
          `[CRITICAL_ROLLBACK_FAILURE] Exception deleting orphaned complaint ${createdComplaint.id}:`,
          rbErr
        );
      }

      return NextResponse.json(
        {
          error: 'Image upload failed',
          message:
            uploadError instanceof Error
              ? uploadError.message
              : 'Failed to upload photo to storage. Complaint submission was cancelled.',
        },
        { status: 500 }
      );
    }

    // 3. Fetch newly created complaint with joined relations and signed URL
    const fullComplaint = await getComplaintById(createdComplaint.id);
    const enriched = fullComplaint
      ? await attachSignedUrlsToComplaint(fullComplaint)
      : createdComplaint;

    return NextResponse.json(
      {
        success: true,
        message: 'Complaint submitted successfully and logged for municipal assignment.',
        complaint: enriched,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/complaints POST] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process complaint submission',
        details: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    );
  }
}
