import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { notificationsApi } from '@/api';
import type { Notification, NotificationType } from '@/types';
import { formatTimeAgo, parseUtc } from '@/lib/format';
import { notifyNotificationsChanged } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, LoadingState } from '@/components/states';
import { FilterTabs } from '@/components/FilterTabs';
import { AlertTriangle, Bell, Check, CheckCheck, Clock, Info, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

const typeConfig: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  AppointmentReminder: { icon: Clock, className: 'bg-warning/10 text-warning' },
  AppointmentConfirmed: { icon: Check, className: 'bg-primary/10 text-primary' },
  AppointmentCancelled: { icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  AppointmentCompleted: { icon: CheckCheck, className: 'bg-success/10 text-success' },
  SystemAlert: { icon: Info, className: 'bg-info/10 text-info' },
};

type Filter = 'all' | 'unread';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

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
      notifyNotificationsChanged();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      notifyNotificationsChanged();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Page width="narrow">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.` : 'You’re all caught up.'}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck aria-hidden="true" /> Mark all as read
            </Button>
          ) : undefined
        }
      />

      <FilterTabs
        label="Show notifications"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
        ]}
        className="mb-6"
      />

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <LoadingState label="Loading notifications…" />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="Booking confirmations, reminders and updates will appear here."
          />
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
            {notifications.map((n) => {
              const config = typeConfig[n.type] ?? typeConfig.SystemAlert;
              const Icon = config.icon;
              const created = parseUtc(n.createdAt);
              return (
                <li key={n.id} className={cn('flex gap-4 px-4 py-4 sm:px-5', !n.isRead && 'bg-secondary/40')}>
                  <span className={cn('mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg', config.className)}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <h2 className={cn('text-sm', n.isRead ? 'font-medium text-foreground/80' : 'font-semibold text-foreground')}>
                        {!n.isRead && <span className="sr-only">Unread: </span>}
                        {n.title}
                      </h2>
                      <time dateTime={created.toISOString()} title={format(created, 'PPpp')} className="shrink-0 text-xs text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  {!n.isRead ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-primary"
                      onClick={() => handleMarkRead(n.id)}
                      aria-label={`Mark “${n.title}” as read`}
                      title="Mark as read"
                    >
                      <Check aria-hidden="true" />
                    </Button>
                  ) : (
                    <span className="size-9 shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
}
