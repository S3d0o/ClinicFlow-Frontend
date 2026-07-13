import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { notificationsApi } from '@/api';
import type { Notification, NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  Check,
  AlertTriangle,
  Info,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  AppointmentReminder: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  AppointmentConfirmed: { icon: Check, color: 'text-teal-600', bg: 'bg-teal-50' },
  AppointmentCancelled: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  AppointmentCompleted: { icon: CheckCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SystemAlert: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getMyNotifications(filter === 'unread');
      setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="text-sm text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  Unread
                </button>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-500">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n, i) => {
                const config = typeConfig[n.type];
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className={`border-slate-100 hover:border-teal-200 transition-colors ${!n.isRead ? 'bg-teal-50/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`h-9 w-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`text-sm font-medium ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h3>
                              <span className="text-xs text-slate-400 shrink-0">
                                {format(parseISO(n.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                          </div>
                          {!n.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-teal-600 shrink-0"
                              onClick={() => handleMarkRead(n.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
