import 'server-only';
import { getDb } from './client';
import type { NotificationRecord } from '@/types';

/**
 * Creates an in-app notification for a user.
 */
export async function createNotification(
  recipientId: string,
  title: string,
  message: string,
  complaintId?: string | null
): Promise<NotificationRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      complaint_id: complaintId || null,
      title,
      message,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to create notification: ${error?.message}`);
  }

  return data as NotificationRecord;
}

/**
 * Retrieves notifications for a specific user.
 * Bounded by limit (default 50) and stably ordered descending by creation date.
 */
export async function getUserNotifications(
  recipientId: string,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<NotificationRecord[]> {
  const db = getDb();

  let query = db
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[JanSahayak DB] Failed to fetch notifications: ${error.message}`);
  }

  return (data || []) as NotificationRecord[];
}

/**
 * Retrieves a single notification by ID.
 */
export async function getNotificationById(
  id: string
): Promise<NotificationRecord | null> {
  const db = getDb();

  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as NotificationRecord;
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationRecord> {
  const db = getDb();

  const { data, error } = await db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[JanSahayak DB] Failed to mark notification as read: ${error?.message}`);
  }

  return data as NotificationRecord;
}
