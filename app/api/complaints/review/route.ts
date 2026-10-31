import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-guards';
import { resolveDemoUserId } from '@/lib/db/users';
import {
  getComplaintById,
  updateComplaintStatus,
  isValidStatusTransition,
} from '@/lib/db/complaints';
import { getAiVerificationByComplaint } from '@/lib/db/ai-verifications';
import { getDb } from '@/lib/db/client';
import { createNotification } from '@/lib/db/notifications';
import { officerReviewComplaintSchema } from '@/lib/validation/complaints';
import type { ComplaintStatus } from '@/types';

/**
 * POST /api/complaints/review
 * Handles Municipal Officer review actions for complaints in 'under_review' status.
 * Actions:
 *  - approve: transitions complaint to 'resolved'
 *  - rework: transitions complaint to 'rework_required'
 *  - reject: transitions complaint to 'rejected'
 *
 * Requirements:
 * 1. Officer-only authorization guard.
 * 2. Zod input validation for action and mandatory review remarks.
 * 3. Immediate server-side state verification (prevents duplicate submissions or invalid state transitions).
 * 4. Records officer identity, remarks, and timestamp into complaint_history audit trail.
 * 5. Synchronizes human review columns on ai_verifications if a record exists.
 * 6. Dispatches in-app notifications with explicit failure logging (Requirement C).
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

    const parsed = officerReviewComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { complaint_id, action, remarks } = parsed.data;

    // 1. Resolve officer ID
    const officerId =
      session.user.dbUserId || (await resolveDemoUserId('officer'));

    // 2. Immediately verify complaint exists and current status on server (Requirement E)
    const complaint = await getComplaintById(complaint_id);
    if (!complaint) {
      return NextResponse.json(
        { error: 'Not Found', message: `Complaint '${complaint_id}' not found.` },
        { status: 404 }
      );
    }

    const currentStatus = complaint.status as ComplaintStatus;

    // Terminal state protection
    if (currentStatus === 'resolved' || currentStatus === 'rejected') {
      return NextResponse.json(
        {
          error: 'Duplicate or invalid action',
          message: `Complaint '${complaint.complaint_code}' is already in terminal state '${currentStatus}'. No further review actions are permitted.`,
        },
        { status: 400 }
      );
    }

    // Determine target status and action name
    let targetStatus: ComplaintStatus;
    let actionName: string;
    let humanReviewStatus: 'approved' | 'rework_required' | 'rejected';

    if (action === 'approve') {
      if (currentStatus !== 'under_review') {
        return NextResponse.json(
          {
            error: 'Invalid state transition',
            message: `Approval requires complaint to be in 'under_review' status. Current status is '${currentStatus}'.`,
          },
          { status: 400 }
        );
      }
      targetStatus = 'resolved';
      actionName = 'officer_approved';
      humanReviewStatus = 'approved';
    } else if (action === 'rework') {
      if (currentStatus !== 'under_review') {
        return NextResponse.json(
          {
            error: 'Invalid state transition',
            message: `Rework request requires complaint to be in 'under_review' status. Current status is '${currentStatus}'.`,
          },
          { status: 400 }
        );
      }
      targetStatus = 'rework_required';
      actionName = 'officer_rework_requested';
      humanReviewStatus = 'rework_required';
    } else if (action === 'reject') {
      // Rejection is valid from 'under_review' (rejected cleanup) or 'submitted' (out-of-scope/spam)
      if (!['under_review', 'submitted'].includes(currentStatus)) {
        return NextResponse.json(
          {
            error: 'Invalid state transition',
            message: `Rejection is only permitted for complaints in 'under_review' or 'submitted' status. Current status is '${currentStatus}'.`,
          },
          { status: 400 }
        );
      }
      targetStatus = 'rejected';
      actionName = 'officer_rejected';
      humanReviewStatus = 'rejected';
    } else {
      return NextResponse.json(
        { error: 'Bad Request', message: `Unknown action '${action}'` },
        { status: 400 }
      );
    }

    if (!isValidStatusTransition(currentStatus, targetStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid state machine transition',
          message: `Cannot transition complaint from '${currentStatus}' to '${targetStatus}'.`,
        },
        { status: 400 }
      );
    }

    // 3. Update complaint status with state machine enforcement and history audit logging (Requirement B & 7)
    await updateComplaintStatus(
      complaint_id,
      targetStatus,
      officerId,
      actionName,
      remarks
    );

    // 4. Synchronize ai_verifications table if a record exists for this complaint
    try {
      const existingVerification = await getAiVerificationByComplaint(complaint_id);
      if (existingVerification) {
        const db = getDb();
        await db
          .from('ai_verifications')
          .update({
            human_review_status: humanReviewStatus,
            reviewed_by: officerId,
            review_remarks: remarks,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVerification.id);
      }
    } catch (aiSyncErr) {
      console.error(
        `[API /api/complaints/review POST] Warning: Failed to sync AI verification record for complaint '${complaint_id}':`,
        aiSyncErr
      );
    }

    // 5. In-app notification dispatch (best-effort, logged, transparent - Requirement C & 8)
    let notificationSent = false;
    let notificationWarning: string | null = null;

    try {
      if (targetStatus === 'resolved' && complaint.reporter_id) {
        // Notify citizen of resolution
        await createNotification(
          complaint.reporter_id,
          `Complaint Resolved: ${complaint.complaint_code}`,
          `Your civic grievance (${complaint.complaint_code}) has been reviewed and verified as resolved by the municipal officer. Officer notes: "${remarks}"`,
          complaint_id
        );
        notificationSent = true;
      } else if (targetStatus === 'rework_required') {
        // Notify assigned worker that rework is required
        const assignment =
          complaint.current_or_latest_assignment && !Array.isArray(complaint.current_or_latest_assignment)
            ? complaint.current_or_latest_assignment
            : complaint.active_assignment && !Array.isArray(complaint.active_assignment)
            ? complaint.active_assignment
            : null;
        const workerId = assignment?.worker_id || null;

        if (workerId) {
          await createNotification(
            workerId,
            `Rework Required: ${complaint.complaint_code}`,
            `Cleanup for ${complaint.complaint_code} was marked for rework by the municipal officer. Corrective remarks: "${remarks}"`,
            complaint_id
          );
          notificationSent = true;
        }
      } else if (targetStatus === 'rejected' && complaint.reporter_id) {
        // Notify citizen of rejection
        await createNotification(
          complaint.reporter_id,
          `Complaint Rejected: ${complaint.complaint_code}`,
          `Your grievance (${complaint.complaint_code}) was reviewed and rejected by the municipal officer. Reason: "${remarks}"`,
          complaint_id
        );
        notificationSent = true;
      }
    } catch (notifErr) {
      console.error(
        `[API /api/complaints/review POST] Non-fatal notification failure for complaint '${complaint_id}':`,
        notifErr
      );
      notificationWarning = 'Review was saved, but in-app notification could not be delivered.';
    }

    // 6. Return response with fresh updated complaint record
    const updatedComplaint = await getComplaintById(complaint_id);

    const actionMessages: Record<string, string> = {
      approve: `Complaint ${complaint.complaint_code} successfully approved and marked resolved.`,
      rework: `Complaint ${complaint.complaint_code} returned for worker rework.`,
      reject: `Complaint ${complaint.complaint_code} marked as rejected.`,
    };

    return NextResponse.json({
      success: true,
      message: actionMessages[action] || 'Review completed successfully.',
      action,
      complaint: updatedComplaint,
      notificationSent,
      ...(notificationWarning ? { warning: notificationWarning } : {}),
    });
  } catch (error) {
    console.error('[API /api/complaints/review POST] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process officer review',
        details: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    );
  }
}

