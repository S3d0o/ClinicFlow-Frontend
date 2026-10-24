import type { Page, PageRequest } from '@/shared/api/page';
import type { AppNotification, NotificationCategory } from '../model/notification';

/**
 * The in-app inbox (`/api/v2/notifications`, V1 #32–#35). Notifications are sent from the outbox about
 * 2 s after the action that causes them (contract 4.0.0-p0 §1), so screens refetch on focus, on
 * navigation and on an interval rather than right after an action.
 */
export interface NotificationsService {
  list(request: PageRequest & { category?: NotificationCategory }): Promise<Page<AppNotification>>;
  unreadCount(): Promise<number>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(): Promise<void>;
}
