import api from './axios';
import type { Notification } from '@/types';

export const notificationsApi = {
  getMyNotifications: (unreadOnly?: boolean) =>
    api.get<Notification[]>('/notifications/my', { params: { unreadOnly } }),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};
