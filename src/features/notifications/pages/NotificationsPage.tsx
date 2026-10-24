import { useState } from 'react';
import { ArrowLeft, BellRing, CalendarCheck, CalendarClock, CalendarX, ChevronRight, FileHeart, ReceiptText, SlidersHorizontal, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pageCount } from '@/shared/api/page';
import { useLanguage } from '@/shared/i18n/use-language';
import { todayIn } from '@/shared/lib/branch-time';
import { formatInstant } from '@/shared/lib/intl';
import { useNow } from '@/shared/lib/use-now';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks/use-notifications';
import { linkPath, type AppNotification, type NotificationCategory, type NotificationType } from '../model/notification';

const PAGE_SIZE = 20;
const CATEGORIES: (NotificationCategory | undefined)[] = [undefined, 'appointments', 'billing', 'prescriptions'];
const ICONS: Record<NotificationType, typeof BellRing> = {
  AppointmentConfirmed: CalendarCheck,
  AppointmentReminder: BellRing,
  AppointmentRescheduled: CalendarClock,
  AppointmentCancelled: CalendarX,
  DepositReceived: Wallet,
  InvoiceIssued: ReceiptText,
  PaymentReceived: Wallet,
  PrescriptionReady: FileHeart,
};

function NotificationItem({ notification, onOpen }: { notification: AppNotification; onOpen: (n: AppNotification) => void }) {
  const { t } = useTranslation('notifications');
  const { language } = useLanguage();
  const Icon = ICONS[notification.type];
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={cn(
          'flex w-full gap-3 rounded-2xl border p-4 text-start transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          notification.isRead ? 'border-border bg-card' : 'border-primary/20 bg-secondary/50'
        )}
      >
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex items-start justify-between gap-2">
            <span dir="auto" className="text-start text-label-md text-foreground">
              {notification.title}
            </span>
            {!notification.isRead && (
              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-highlight">
                <span className="sr-only">{t('unread')}</span>
              </span>
            )}
          </span>
          <span dir="auto" className="block text-start text-body-sm text-muted-foreground">
            {notification.message}
          </span>
          <span className="block text-caption text-muted-foreground">
            {formatInstant(notification.createdAt, language, 'Africa/Cairo', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
          </span>
        </span>
      </button>
    </li>
  );
}

/** The in-app inbox (design patient/18): filter, mark read, open what each notification is about. */
export default function NotificationsPage() {
  const { t } = useTranslation(['notifications', 'screens', 'common']);
  const navigate = useNavigate();
  const now = useNow();
  const [category, setCategory] = useState<NotificationCategory | undefined>(undefined);
  const [page, setPage] = useState(1);
  const notifications = useNotifications(category, page, PAGE_SIZE);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const open = (notification: AppNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    if (notification.link) navigate(linkPath(notification.link));
  };

  const today = todayIn('Africa/Cairo', now);
  const items = notifications.data?.items ?? [];
  const groups = [
    { label: t('today'), items: items.filter((n) => todayIn('Africa/Cairo', new Date(n.createdAt)) === today) },
    { label: t('earlier'), items: items.filter((n) => todayIn('Africa/Cairo', new Date(n.createdAt)) !== today) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label={t('common:actions.back')}>
          <Link to="/patient">
            <ArrowLeft className="rtl-flip" />
          </Link>
        </Button>
        <h1 className="flex-1 font-display text-headline-md text-ink">{t('screens:notifications')}</h1>
        <Button variant="link" size="sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
          {t('markAllRead')}
        </Button>
      </header>

      <div role="group" aria-label={t('categories.label')} className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {CATEGORIES.map((option) => (
          <button
            key={option ?? 'all'}
            type="button"
            aria-pressed={category === option}
            onClick={() => {
              setCategory(option);
              setPage(1);
            }}
            className={cn(
              'min-h-10 shrink-0 rounded-full border px-4 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              category === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'
            )}
          >
            {t(`categories.${option ?? 'all'}`)}
          </button>
        ))}
      </div>

      {notifications.isPending ? (
        <LoadingState />
      ) : notifications.isError ? (
        <ErrorState onRetry={() => void notifications.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState className="rounded-2xl border border-dashed border-border" title={category ? t('emptyCategory') : t('empty')} />
      ) : (
        <>
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label} className="space-y-3">
              <h2 className="font-display text-title-sm text-ink">{group.label}</h2>
              <ul className={cn('space-y-3', notifications.isPlaceholderData && 'opacity-60')}>
                {group.items.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onOpen={open} />
                ))}
              </ul>
            </section>
          ))}
          <Pagination page={page} pageCount={pageCount(notifications.data.total, PAGE_SIZE)} onChange={setPage} />
        </>
      )}

      <Link to="/patient/profile" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-label-md text-primary hover:bg-accent">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        <span className="flex-1">{t('preferences')}</span>
        <ChevronRight aria-hidden="true" className="rtl-flip size-4" />
      </Link>
    </div>
  );
}
