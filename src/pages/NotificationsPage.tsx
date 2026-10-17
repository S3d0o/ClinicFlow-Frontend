import { useState } from 'react';
import { format } from 'date-fns';
import { notificationsApi } from '@/api';
import type { Notification, NotificationType } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatTimeAgo, parseUtc } from '@/lib/format';
import { notifyNotificationsChanged } from '@/lib/notifications';
import { pageCount, readTotalCount } from '@/lib/paging';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useApiQuery } from '@/hooks/use-api-query';
import { FilterTabs } from '@/components/FilterTabs';
import { Pagination } from '@/components/Pagination';
import { AlertTriangle, Bell, Check, CheckCheck, Clock, Info, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

const typeConfig: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  AppointmentReminder: { icon: Clock, className: 'bg-warning/10 text-warning' },
  AppointmentConfirmed: { icon: Check, className: 'bg-success/10 text-success' },
  AppointmentCancelled: { icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  AppointmentCompleted: { icon: CheckCheck, className: 'bg-info/10 text-info' },
  SystemAlert: { icon: Info, className: 'bg-secondary text-secondary-foreground' },
};

type Filter = 'all' | 'unread';

const PAGE_SIZE = 20;

interface NotificationPage {
  items: Notification[];
  /** Matching notifications on all pages */
  total: number;
  /** Unread notifications on all pages, whatever the filter */
  unreadTotal: number;
}

/** One page plus the totals. The list is paged, so both totals come from `X-Total-Count` (API contract #32). */
async function loadPage(filter: Filter, pageNumber: number): Promise<NotificationPage> {
  const unreadOnly = filter === 'unread';
  const [page, unread] = await Promise.all([
    notificationsApi.getMyNotifications({ unreadOnly, pageNumber, pageSize: PAGE_SIZE }),
    // The unread filter already returns the unread total; otherwise ask for it with a one-item page
    unreadOnly ? null : notificationsApi.getMyNotifications({ unreadOnly: true, pageSize: 1 }),
  ]);
  const total = readTotalCount(page.headers) ?? page.data.length;
  const unreadTotal = unread
    ? readTotalCount(unread.headers) ?? page.data.filter((n) => !n.isRead).length
    : total;
  return { items: page.data, total, unreadTotal };
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const { data, loading, error, reload, setData } = useApiQuery(
    () => loadPage(filter, pageNumber),
    `${filter}|${pageNumber}`
  );
  const notifications: Notification[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadTotal ?? 0;

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadTotal: Math.max(0, prev.unreadTotal - 1),
      }));
      notifyNotificationsChanged();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setData((prev) => ({ ...prev, items: prev.items.map((n) => ({ ...n, isRead: true })), unreadTotal: 0 }));
      notifyNotificationsChanged();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const changeFilter = (value: Filter) => {
    setFilter(value);
    setPageNumber(1);
  };

  return (
    <Page width="narrow">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description={
          loading || error
            ? 'Booking confirmations, reminders and updates.'
            : unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`
              : 'You’re all caught up.'
        }
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
        onChange={changeFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
        ]}
        className="mb-6"
      />

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <LoadingState label="Loading notifications…" />
        ) : error ? (
          <ErrorState title="Couldn’t load notifications" message={getApiErrorMessage(error, 'Please try again in a moment.')} onRetry={reload} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="Booking confirmations, reminders and updates will appear here."
          />
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
            {notifications.map((n) => {
              const config = typeConfig[n.type] ?? typeConfig.SystemAlert;
              const Icon = config.icon;
              const created = parseUtc(n.createdAt);
              return (
                <li key={n.id} className={cn('relative flex gap-4 px-4 py-4 sm:px-5', !n.isRead && 'bg-muted before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-primary')}>
                  <span className={cn('mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl', config.className)}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <h2 className={cn('text-sm', n.isRead ? 'font-medium text-foreground/80' : 'font-bold text-foreground')}>
                        {!n.isRead && <span className="sr-only">Unread: </span>}
                        {n.title}
                      </h2>
                      <time dateTime={created.toISOString()} title={format(created, 'PPpp')} className="shrink-0 text-body-sm text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-body-md text-muted-foreground">{n.message}</p>
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

      {/* Outside the list so it stays visible on an empty later page (e.g. after marking all read) */}
      {!loading && !error && (
        <Pagination
          page={pageNumber}
          hasNext={pageNumber * PAGE_SIZE < total}
          pageCount={pageCount(total, PAGE_SIZE)}
          onChange={setPageNumber}
          label="Notification pages"
        />
      )}
    </Page>
  );
}
