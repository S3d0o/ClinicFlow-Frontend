import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import type { NotificationRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { CATEGORY_OF, type AppNotification } from '../model/notification';
import type { NotificationsService } from './notifications.service';

const toView = (record: NotificationRecord): AppNotification => {
  const view: Partial<NotificationRecord> = structuredClone(record);
  delete view.userId;
  return view as AppNotification;
};

export function createMockNotificationsService(deps: AuthMockDeps): NotificationsService {
  const { db, latencyMs } = deps;
  const mine = () => {
    const user = sessionUser(deps);
    return db.notifications.filter((n) => n.userId === user.id);
  };

  return {
    async list({ page, pageSize, category }) {
      await delay(latencyMs);
      const items = mine()
        .filter((n) => !category || CATEGORY_OF[n.type] === category)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = (page - 1) * pageSize;
      return { items: items.slice(start, start + pageSize).map(toView), total: items.length };
    },

    async unreadCount() {
      await delay(latencyMs);
      return mine().filter((n) => !n.isRead).length;
    },

    async markRead(notificationId) {
      await delay(latencyMs);
      const notification = mine().find((n) => n.id === notificationId);
      if (!notification) throw new ServiceError('Notification.NotFound');
      notification.isRead = true;
    },

    async markAllRead() {
      await delay(latencyMs);
      for (const notification of mine()) notification.isRead = true;
    },
  };
}
