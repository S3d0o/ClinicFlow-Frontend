import api from './axios';
import type { Notification, NotificationFilter } from '@/types';

export const notificationsApi = {
  /** One page, newest first (default page 1 of 50). The total is in the `X-Total-Count` header. */
  getMyNotifications: (filter: NotificationFilter = {}) =>
    api.get<Notification[]>('/notifications/my', { params: filter }),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};
