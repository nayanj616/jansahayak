import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/api-guards';
import { resolveDemoUserId } from '@/lib/db/users';
import { getNotificationById, markNotificationAsRead } from '@/lib/db/notifications';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/notifications/[id]/read
 * Marks an unread notification as read, ensuring strict ownership.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;
  const { id } = await context.params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid notification ID format. Must be a valid UUID.',
      },
      { status: 400 }
    );
  }

  try {
    const currentUserId =
      session.user.dbUserId || (await resolveDemoUserId(session.user.role));

    // 1. Fetch notification to verify existence and ownership
    const notification = await getNotificationById(id);

    if (!notification) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Notification not found.',
        },
        { status: 404 }
      );
    }

    // 2. Strict ownership validation: cannot mark another user's notification
    if (notification.recipient_id !== currentUserId) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message:
            'Forbidden: You do not have permission to modify notifications addressed to another user.',
        },
        { status: 403 }
      );
    }

    // 3. Idempotent check: if already read, return success safely without redundant update
    if (notification.read_at) {
      return NextResponse.json({
        success: true,
        notification,
        alreadyRead: true,
      });
    }

    // 4. Mark as read
    const updated = await markNotificationAsRead(id);

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /api/notifications/[id]/read PATCH Error]:', message);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to mark notification as read.',
      },
      { status: 500 }
    );
  }
}

