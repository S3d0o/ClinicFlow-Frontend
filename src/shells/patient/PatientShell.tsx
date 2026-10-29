import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { isNavItemActive, visiblePatientNav, type patientNav } from '@/app/navigation';
import { useSession } from '@/features/auth/hooks/use-session';
import { notificationKeys, useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { Logo } from '@/shared/ui/Logo';
import { SkipLink } from '@/shared/ui/SkipLink';
import { ScreenOutlet } from '../ScreenOutlet';

/**
 * The bell with the unread count. Notifications arrive a couple of seconds after the action that
 * causes them (the outbox), so the count refreshes on every page change as well as on its interval.
 */
function NotificationsBell() {
  const { t } = useTranslation(['notifications', 'common']);
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { data: unread = 0 } = useUnreadCount();

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
  }, [pathname, queryClient]);

  return (
    <Button asChild variant="ghost" size="icon" aria-label={unread ? t('bellLabel', { count: unread }) : t('common:topbar.notifications')}>
      <Link to="/patient/notifications" className="relative">
        <Bell />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute end-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[0.625rem] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}

/**
 * The patient portal, designed mobile-first (design-v2/screens/patient): a top bar, the page, and a
 * five-item bottom navigation with 44px targets. From `md` up the same items move into the top bar.
 */
export function PatientShell() {
  const { t } = useTranslation(['nav', 'common']);
  const { pathname } = useLocation();
  const { modules } = useSession();
  const items = visiblePatientNav(modules);
  const isActive = (item: (typeof patientNav)[number]) => isNavItemActive(item, pathname, item.to === '/patient');

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Logo to="/patient" />
          <nav aria-label={t('common:appName')} className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2 text-label-md transition-colors',
                  isActive(item) ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {t(`patient.${item.label}`)}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <LanguageToggle />
            <NotificationsBell />
          </div>
        </div>
      </header>

      <ScreenOutlet className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 md:pb-10" />

      <nav
        aria-label={t('common:appName')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-caption font-medium',
                  isActive(item) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon aria-hidden="true" className="size-5" />
                {t(`patient.${item.label}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
