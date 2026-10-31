import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-guards';
import { resolveDemoUserId } from '@/lib/db/users';
import {
  getWorkerAssignments,
  getAssignmentWithDetails,
  startAssignmentTask,
  completeAssignmentTask,
} from '@/lib/db/assignments';
import { deleteComplaintImageRecord } from '@/lib/db/images';
import {
  attachSignedUrlsToAssignments,
  attachSignedUrlsToAssignment,
  uploadAndLinkComplaintImage,
  deleteStorageObject,
  validateFileBuffer,
} from '@/lib/storage';
import { startTaskSchema, completeTaskSchema } from '@/lib/validation/tasks';
import type { AssignmentStatus } from '@/types';

/**
 * GET /api/tasks
 * Retrieves assigned tasks for the authenticated sanitation worker.
 * Strictly scoped to the worker's dbUserId - no cross-worker access.
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiRole('worker', request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);

  try {
    const workerId =
      session.user.dbUserId || (await resolveDemoUserId('worker'));

    const statusParam = searchParams.get('status') as AssignmentStatus | null;
    let statusFilter: AssignmentStatus | undefined;
    if (
      statusParam &&
      ['assigned', 'in_progress', 'completed', 'cancelled'].includes(statusParam)
    ) {
      statusFilter = statusParam;
    }

    const assignments = await getWorkerAssignments(workerId, statusFilter);
    const enrichedTasks = await attachSignedUrlsToAssignments(assignments);

    return NextResponse.json({
      success: true,
      count: enrichedTasks.length,
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error('[API /api/tasks GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch worker tasks',
        details: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Handles sanitation worker actions on assigned tasks:
 * 1. action: 'start' -> transitions assignment to 'in_progress' and complaint to 'in_progress'.
 * 2. action: 'complete' -> validates after-cleanup photo, uploads to 'cleanup-evidence',
 *    records image metadata, transitions assignment to 'completed', and moves complaint to 'under_review'.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiRole('worker', request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const workerId =
      session.user.dbUserId || (await resolveDemoUserId('worker'));

    const contentType = request.headers.get('content-type') || '';
    let action: string | null = null;
    let assignmentId: string | null = null;
    let remarks: string | null = null;
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      action = formData.get('action') as string | null;
      assignmentId = formData.get('assignment_id') as string | null;
      remarks = (formData.get('remarks') as string | null) || null;
      file = formData.get('image') as File | null;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      action = body.action || null;
      assignmentId = body.assignment_id || null;
      remarks = body.remarks || null;
    } else {
      return NextResponse.json(
        {
          error: 'Unsupported content type',
          message: 'Expected application/json or multipart/form-data',
        },
        { status: 415 }
      );
    }

    if (!action) {
      return NextResponse.json(
        {
          error: 'Missing action parameter',
          message: "Action must be specified ('start' or 'complete').",
        },
        { status: 400 }
      );
    }

    // --- Action: START TASK ---
    if (action === 'start') {
      const parsed = startTaskSchema.safeParse({ assignment_id: assignmentId });
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: parsed.error.format(),
          },
          { status: 400 }
        );
      }

      const updated = await startAssignmentTask(parsed.data.assignment_id, workerId);
      const enriched = await attachSignedUrlsToAssignment(updated);

      return NextResponse.json({
        success: true,
        message: 'Task started successfully. Work is now in progress.',
        task: enriched,
      });
    }

    // --- Action: COMPLETE TASK ---
    if (action === 'complete') {
      const parsed = completeTaskSchema.safeParse({
        assignment_id: assignmentId,
        remarks,
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

      // Photographic evidence is mandatory
      if (!file || file.size === 0) {
        return NextResponse.json(
          {
            error: 'Missing photographic evidence',
            message:
              'An after-cleanup photograph is mandatory before completing a sanitation task.',
          },
          { status: 400 }
        );
      }

      // Check assignment ownership & state before uploading
      const existing = await getAssignmentWithDetails(parsed.data.assignment_id);
      if (!existing) {
        return NextResponse.json(
          { error: 'Not found', message: `Assignment '${parsed.data.assignment_id}' not found.` },
          { status: 404 }
        );
      }

      if (existing.worker_id !== workerId) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You are not authorized to complete tasks assigned to other workers.',
          },
          { status: 403 }
        );
      }

      if (existing.status === 'completed') {
        return NextResponse.json(
          {
            error: 'Invalid state',
            message: 'This task has already been completed.',
          },
          { status: 400 }
        );
      }

      if (existing.status !== 'in_progress') {
        return NextResponse.json(
          {
            error: 'Invalid state',
            message: `Task must be 'in_progress' to complete. Current status is '${existing.status}'. Please start the task first.`,
          },
          { status: 400 }
        );
      }

      // Validate image buffer
      const fileBytes = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileBytes);
      const fileValidation = validateFileBuffer(fileBuffer, file.type);

      if (!fileValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid file upload',
            message: fileValidation.error,
          },
          { status: 400 }
        );
      }

      // Upload after-cleanup photo to private 'cleanup-evidence' bucket
      let uploadedImageRecord;
      try {
        const uploadRes = await uploadAndLinkComplaintImage({
          complaintId: existing.complaint_id,
          imageType: 'after',
          bucket: 'cleanup-evidence',
          fileBuffer,
          contentType: file.type,
          originalFilename: file.name,
          uploadedBy: workerId,
        });
        uploadedImageRecord = uploadRes.imageRecord;
      } catch (uploadError) {
        console.error('[API /api/tasks POST] Storage upload failed:', uploadError);
        return NextResponse.json(
          {
            error: 'Storage upload failed',
            message:
              uploadError instanceof Error
                ? uploadError.message
                : 'Failed to upload cleanup photo to storage.',
          },
          { status: 500 }
        );
      }

      // Complete assignment and update complaint status
      let updatedAssignment;
      try {
        updatedAssignment = await completeAssignmentTask(
          parsed.data.assignment_id,
          workerId,
          parsed.data.remarks
        );
      } catch (completeError) {
        console.error(
          '[API /api/tasks POST] completeAssignmentTask failed. Rolling back uploaded image:',
          completeError
        );
        // Clean up uploaded image if assignment completion fails
        try {
          if (uploadedImageRecord) {
            await deleteStorageObject('cleanup-evidence', uploadedImageRecord.object_path);
            await deleteComplaintImageRecord(uploadedImageRecord.id);
          }
        } catch (rbErr) {
          console.error('[API /api/tasks POST] Rollback error:', rbErr);
        }

        return NextResponse.json(
          {
            error: 'Completion failed',
            message:
              completeError instanceof Error
                ? completeError.message
                : 'Failed to complete assignment task.',
          },
          { status: 400 }
        );
      }

      const enriched = await attachSignedUrlsToAssignment(updatedAssignment);

      return NextResponse.json({
        success: true,
        message:
          'Cleanup proof submitted successfully. Task marked completed and forwarded for municipal review.',
        task: enriched,
      });
    }

    return NextResponse.json(
      {
        error: 'Invalid action',
        message: `Unknown action '${action}'. Permitted actions are 'start' and 'complete'.`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API /api/tasks POST] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process task request',
        details: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    );
  }
}

