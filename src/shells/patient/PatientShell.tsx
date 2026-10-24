import { Bell } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { patientNav } from '@/app/navigation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { Logo } from '@/shared/ui/Logo';
import { SkipLink } from '@/shared/ui/SkipLink';
import { ScreenOutlet } from '../ScreenOutlet';

/**
 * The patient portal, designed mobile-first (design-v2/screens/patient): a top bar, the page, and a
 * five-item bottom navigation with 44px targets. From `md` up the same items move into the top bar.
 */
export function PatientShell() {
  const { t } = useTranslation(['nav', 'common']);

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Logo to="/patient" />
          <nav aria-label={t('common:appName')} className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {patientNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/patient'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-label-md transition-colors',
                    isActive ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                {t(`patient.${item.label}`)}
              </NavLink>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" size="icon" aria-label={t('common:topbar.notifications')}>
              <Link to="/patient/notifications">
                <Bell />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ScreenOutlet className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 md:pb-10" />

      <nav
        aria-label={t('common:appName')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {patientNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/patient'}
                className={({ isActive }) =>
                  cn(
                    'flex h-full flex-col items-center justify-center gap-1 text-caption font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                <item.icon aria-hidden="true" className="size-5" />
                {t(`patient.${item.label}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
