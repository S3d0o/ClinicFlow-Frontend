import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { NotificationCategory } from '../model/notification';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (category: NotificationCategory | undefined, page: number) => ['notifications', 'list', category ?? 'all', page] as const,
  unread: ['notifications', 'unread'] as const,
};

/** How often the unread count refreshes while the tab is visible (V1 did the same, contract §1). */
const UNREAD_REFRESH_MS = 60_000;

export function useNotifications(category: NotificationCategory | undefined, page: number, pageSize: number) {
  const { notifications } = useServices();
  return useQuery({
    queryKey: notificationKeys.list(category, page),
    queryFn: () => notifications.list({ page, pageSize, category }),
    placeholderData: keepPreviousData,
  });
}

/**
 * The bell's count. Notifications arrive a couple of seconds after the action that causes them
 * (the outbox), so the count refreshes on focus, on an interval and when the shell asks.
 */
export function useUnreadCount() {
  const { notifications } = useServices();
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notifications.unreadCount(),
    refetchInterval: UNREAD_REFRESH_MS,
    refetchIntervalInBackground: false,
  });
}

export function useMarkRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notifications.markRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
