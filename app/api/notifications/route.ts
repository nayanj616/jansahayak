import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/api-guards';
import { resolveDemoUserId } from '@/lib/db/users';
import { getUserNotifications } from '@/lib/db/notifications';

/**
 * GET /api/notifications
 * Retrieves in-app notifications strictly scoped to the authenticated demo persona.
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const recipientId =
      session.user.dbUserId || (await resolveDemoUserId(session.user.role));

    const notifications = await getUserNotifications(recipientId, false, 50);
    const unreadCount = notifications.filter((n) => !n.read_at).length;

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        recipient_id: n.recipient_id,
        complaint_id: n.complaint_id,
        title: n.title,
        message: n.message,
        read_at: n.read_at,
        created_at: n.created_at,
      })),
      unreadCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /api/notifications GET Error]:', message);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch notifications.',
      },
      { status: 500 }
    );
  }
}

