'use client';

import * as React from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { NotificationRecord } from '@/types';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [markingReadId, setMarkingReadId] = React.useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch on mount to populate unread badge count (no sync setState inside effect)
  React.useEffect(() => {
    let ignore = false;

    async function loadBadgeCount() {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) {
          setNotifications(data.notifications || []);
          setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
          setHasLoadedOnce(true);
        }
      } catch {
        // Quiet on background initial badge count check
      }
    }

    loadBadgeCount();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch full notification list with UI loading and error state
  const fetchNotifications = React.useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        throw new Error(`Failed to load notifications (HTTP ${res.status})`);
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      setHasLoadedOnce(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to notification service';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When dropdown opens, refresh notification data
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications(!hasLoadedOnce);
    }
  };

  // Close on outside click or Escape key
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mark an unread notification as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (markingReadId) return;

    setMarkingReadId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationBell] Error marking notification as read:', err);
    } finally {
      setMarkingReadId(null);
    }
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600 cursor-pointer',
          isOpen && 'bg-slate-100 text-civic-800'
        )}
        aria-label={
          unreadCount > 0
            ? t('notifications.unreadCount', { count: unreadCount })
            : t('notifications.title')
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          role="region"
          aria-label={t('notifications.title')}
          className="absolute right-0 z-50 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <Badge variant="submitted" className="text-[10px] py-0 px-1.5">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              disabled={isLoading}
              className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-600"
              aria-label={t('notifications.bellAria')}
            >
              <RotateCw
                className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-civic-600')}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Body Content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {/* Loading State */}
            {isLoading && notifications.length === 0 && (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 text-center space-y-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="text-xs text-rose-700">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(true)}
                  className="text-xs h-7 px-2.5 mt-1"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && notifications.length === 0 && (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold text-slate-700">{t('notifications.emptyTitle')}</p>
                <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto">
                  {t('notifications.emptyDesc')}
                </p>
              </div>
            )}

            {/* Notifications List */}
            {!isLoading &&
              !error &&
              notifications.map((item) => {
                const isUnread = !item.read_at;
                const isMarking = markingReadId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3.5 transition-colors text-left flex items-start gap-3',
                      isUnread
                        ? 'bg-civic-50/50 border-l-3 border-civic-600'
                        : 'bg-white hover:bg-slate-50/70'
                    )}
                  >
                    {/* Status dot */}
                    <div className="pt-1 shrink-0">
                      {isUnread ? (
                        <span
                          className="block h-2 w-2 rounded-full bg-civic-600"
                          aria-label="Unread notification"
                        />
                      ) : (
                        <span
                          className="block h-2 w-2 rounded-full bg-slate-200"
                          aria-label="Read notification"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-xs tracking-tight truncate',
                            isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                          )}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Action: Mark as Read */}
                      {isUnread && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            disabled={isMarking}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-civic-700 hover:text-civic-900 focus-visible:outline-none focus-visible:underline cursor-pointer"
                          >
                            {isMarking ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                <span>Marking...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" aria-hidden="true" />
                                <span>Mark as read</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-center">
            <span className="text-[10px] text-slate-400">
              In-App Notification Center &bull; JanSahayak
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
