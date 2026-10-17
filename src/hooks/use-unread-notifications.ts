import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { notificationsApi } from '@/api';
import { NOTIFICATIONS_CHANGED_EVENT, notifyNotificationsChanged } from '@/lib/notifications';
import type { Notification } from '@/types';

const NOTIFICATION_POLL_MS = 60_000;

/**
 * Unread notifications for the signed-in user. Refreshes on sign-in, on navigation, when the window
 * regains focus or becomes visible, every minute while visible, and whenever a page reports that
 * notifications changed.
 */
export function useUnreadNotifications(enabled: boolean) {
  const location = useLocation();
  const [unread, setUnread] = useState<Notification[]>([]);

  const fetchUnread = useCallback(() => {
    if (!enabled) return;
    notificationsApi
      .getMyNotifications(true)
      .then((res) => setUnread(res.data))
      .catch(() => {});
  }, [enabled]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread, location.pathname]);

  useEffect(() => {
    if (!enabled) return;
    const onChange = () => fetchUnread();
    // Background tabs don't poll; they catch up as soon as they're visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    const poll = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    window.addEventListener('focus', onChange);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = window.setInterval(poll, NOTIFICATION_POLL_MS);
    return () => {
      window.removeEventListener('focus', onChange);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [enabled, fetchUnread]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnread([]);
      notifyNotificationsChanged();
    } catch { /* the bell refreshes on the next poll */ }
  }, []);

  const markRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setUnread((prev) => prev.filter((x) => x.id !== id));
    } catch { /* the caller still navigates */ }
  }, []);

  return { unread: enabled ? unread : [], markAllRead, markRead };
}
