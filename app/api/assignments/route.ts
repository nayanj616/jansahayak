import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-guards';
import { resolveDemoUserId, getDemoUserById } from '@/lib/db/users';
import { getComplaintById } from '@/lib/db/complaints';
import {
  createAssignment,
  isAssignableComplaintStatus,
} from '@/lib/db/assignments';
import { createNotification } from '@/lib/db/notifications';
import { assignComplaintSchema } from '@/lib/validation/complaints';
import type { ComplaintStatus } from '@/types';

/**
 * POST /api/assignments
 * Dispatches or reassigns a complaint to a sanitation field worker.
 * Protected: Officer role only.
 *
 * Requirements:
 * 1. Validates input schema (complaint_id, worker_id, optional notes).
 * 2. Immediately checks current complaint status on the server (Requirement E).
 * 3. Enforces that only 'submitted', 'assigned', and 'rework_required' complaints can be assigned.
 * 4. Cancels prior active assignments and inserts new assignment record.
 * 5. Updates complaint status to 'assigned' and records dispatch notes in complaint_history (Requirement B).
 * 6. Dispatches best-effort notification to assigned worker with failure tracking (Requirement C).
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiRole('officer', request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing JSON request body' },
        { status: 400 }
      );
    }

    const parsed = assignComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { complaint_id, worker_id, notes } = parsed.data;

    // 1. Resolve officer ID
    const officerId =
      session.user.dbUserId || (await resolveDemoUserId('officer'));

    // 2. Validate that the worker exists and is an active worker
    const worker = await getDemoUserById(worker_id);
    if (!worker || worker.role !== 'worker' || !worker.is_active) {
      return NextResponse.json(
        {
          error: 'Invalid worker',
          message: `Worker '${worker_id}' is not an active sanitation worker.`,
        },
        { status: 400 }
      );
    }

    // 3. Immediately verify complaint exists and current status on server (Requirement E)
    const complaint = await getComplaintById(complaint_id);
    if (!complaint) {
      return NextResponse.json(
        { error: 'Not Found', message: `Complaint '${complaint_id}' not found.` },
        { status: 404 }
      );
    }

    const currentStatus = complaint.status as ComplaintStatus;
    if (!isAssignableComplaintStatus(currentStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid state for assignment',
          message: `Cannot assign complaint in '${currentStatus}' status. Assignments are only permitted for 'submitted', 'assigned', or 'rework_required'.`,
        },
        { status: 400 }
      );
    }

    // 4. Create assignment (handles assignment cancellation, insertion, complaint update, and rollback)
    const assignment = await createAssignment(
      complaint_id,
      worker_id,
      officerId,
      notes || null
    );

    // 5. Best-effort in-app notification to the worker (Requirement C)
    let notificationSent = false;
    let notificationWarning: string | null = null;
    try {
      const categoryLabel = complaint.category.replace(/_/g, ' ');
      const notifMessage = notes
        ? `You have been assigned ${complaint.complaint_code} (${categoryLabel}). Instructions: ${notes}`
        : `You have been assigned ${complaint.complaint_code} (${categoryLabel}) for field cleanup.`;

      await createNotification(
        worker_id,
        `Task Assigned: ${complaint.complaint_code}`,
        notifMessage,
        complaint_id
      );
      notificationSent = true;
    } catch (notifErr) {
      console.error(
        `[API /api/assignments POST] Non-fatal notification failure for worker '${worker_id}':`,
        notifErr
      );
      notificationWarning = 'Task was assigned, but the in-app alert notification could not be delivered.';
    }

    // 6. Return response with updated complaint details
    const updatedComplaint = await getComplaintById(complaint_id);

    return NextResponse.json({
      success: true,
      message: `Task successfully dispatched to sanitation worker ${worker.display_name}.`,
      assignment,
      complaint: updatedComplaint,
      notificationSent,
      ...(notificationWarning ? { warning: notificationWarning } : {}),
    });
  } catch (error) {
    console.error('[API /api/assignments POST] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign complaint',
        details: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    );
  }
}

