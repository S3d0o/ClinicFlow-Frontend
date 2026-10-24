import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { visibleStaffNav } from '@/app/navigation';
import { primaryRoleLabel } from '@/features/auth/model/display';
import { useSession } from '@/features/auth/hooks/use-session';
import { useSignOutAndLeave } from '@/features/auth/hooks/use-sign-out-and-leave';
import { ActiveBranchProvider } from '@/features/org/components/ActiveBranchProvider';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { LogoMark } from '@/shared/ui/Logo';
import { SkipLink } from '@/shared/ui/SkipLink';
import { BranchSwitcher } from '../staff/BranchSwitcher';
import { ScreenOutlet } from '../ScreenOutlet';

/** The nurse station on a tablet (design-v2/screens/nurse): a 72px icon rail and large touch targets. */
export function TabletShell() {
  const { t } = useTranslation(['nav', 'common']);
  const { user } = useSession();
  const { signOut, isPending } = useSignOutAndLeave();
  if (!user) return null;

  const items = visibleStaffNav(user).flatMap((group) => group.items);

  return (
    <ActiveBranchProvider>
      <div className="min-h-screen ps-rail">
        <SkipLink />
        <aside className="fixed inset-y-0 start-0 z-40 flex w-rail flex-col items-center gap-4 border-e border-border bg-sidebar py-4">
          <LogoMark />
          <nav aria-label={t('groups.nurse')} className="flex flex-col gap-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                title={t(`items.${item.label}`)}
                aria-label={t(`items.${item.label}`)}
                className={({ isActive }) =>
                  cn(
                    'inline-flex size-12 items-center justify-center rounded-xl transition-colors',
                    isActive ? 'bg-sidebar-active text-sidebar-active-foreground' : 'text-sidebar-foreground hover:bg-accent'
                  )
                }
              >
                <item.icon aria-hidden="true" className="size-5" />
              </NavLink>
            ))}
          </nav>
        </aside>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-6 backdrop-blur">
          <div className="w-56">
            <BranchSwitcher />
          </div>
          <div className="ms-auto flex items-center gap-3">
            <LanguageToggle />
            <Avatar name={user.fullName} size="sm" />
            <div className="hidden text-start sm:block">
              <p className="text-label-md text-foreground">{user.fullName}</p>
              <p className="text-caption text-muted-foreground">{t(`common:roles.${primaryRoleLabel(user)}`)}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label={t('common:actions.signOut')} onClick={signOut} disabled={isPending}>
              <LogOut className="rtl-flip" />
            </Button>
          </div>
        </header>
        <ScreenOutlet className="px-6 py-6" />
      </div>
    </ActiveBranchProvider>
  );
}
