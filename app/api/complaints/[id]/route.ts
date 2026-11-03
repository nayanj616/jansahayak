import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/api-guards';
import { resolveDemoUserId } from '@/lib/db/users';
import { getComplaintById } from '@/lib/db/complaints';
import { attachSignedUrlsToComplaint } from '@/lib/storage';
import { getDb } from '@/lib/db/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/complaints/[id]
 * Retrieves a single complaint by ID with joined relations and fresh signed URLs.
 * Strictly checks role scoping: Citizens can only fetch their own complaints.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Complaint ID is required' },
      { status: 400 }
    );
  }

  try {
    const complaint = await getComplaintById(id);
    if (!complaint) {
      return NextResponse.json(
        { error: 'Not Found', message: `Complaint '${id}' not found` },
        { status: 404 }
      );
    }

    // Role-based access control
    if (session.user.role === 'citizen') {
      const citizenId = session.user.dbUserId || (await resolveDemoUserId('citizen'));
      if (complaint.reporter_id !== citizenId) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You are not authorized to view this complaint.' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'worker') {
      const workerId = session.user.dbUserId || (await resolveDemoUserId('worker'));
      const assignedWorkerId =
        complaint.current_or_latest_assignment?.worker_id ||
        complaint.active_assignment?.worker_id;

      if (assignedWorkerId !== workerId) {
        // Fallback check if any assignment record links this worker to this complaint
        const db = getDb();
        const { data: workerAssignment } = await db
          .from('assignments')
          .select('id')
          .eq('complaint_id', id)
          .eq('worker_id', workerId)
          .limit(1)
          .maybeSingle();

        if (!workerAssignment) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Workers can only view complaints assigned to them.' },
            { status: 403 }
          );
        }
      }
    }

    // Attach fresh signed URLs for complaint photos on-demand (Requirement D)
    const enriched = await attachSignedUrlsToComplaint(complaint);

    return NextResponse.json({
      success: true,
      complaint: enriched,
    });
  } catch (error) {
    console.error(`[API /api/complaints/${id} GET] Error:`, error);
    return NextResponse.json(
      {
        error: 'Failed to fetch complaint details',
        details: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}

