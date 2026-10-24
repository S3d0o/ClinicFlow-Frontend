import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicNav } from '@/app/navigation';
import { homePath } from '@/features/auth/model/access';
import { useSession } from '@/features/auth/hooks/use-session';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { Logo } from '@/shared/ui/Logo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';

function AccountActions({ stacked = false }: { stacked?: boolean }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const width = stacked ? 'w-full' : undefined;

  if (user) {
    return (
      <Button asChild className={width}>
        <Link to={homePath(user)}>{t('actions.myAccount')}</Link>
      </Button>
    );
  }
  return (
    <>
      <Button asChild variant="ghost" className={width}>
        <Link to="/sign-in">{t('actions.signIn')}</Link>
      </Button>
      <Button asChild className={width}>
        <Link to="/sign-up">{t('actions.createAccount')}</Link>
      </Button>
    </>
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative py-2 text-label-md transition-colors hover:text-primary',
    isActive ? 'text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-highlight' : 'text-muted-foreground'
  );

/** Top navigation for visitors: product links, language, and sign-in or "My account". */
export function PublicNavbar() {
  const { t } = useTranslation(['nav', 'common']);
  const { direction } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label={t('common:appName')} className="hidden flex-1 items-center gap-6 lg:flex">
          {publicNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {t(`public.${item.label}`)}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <AccountActions />
        </div>

        <div className="ms-auto flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('common:actions.openMenu')}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="gap-6 p-6">
              <SheetTitle className="sr-only">{t('common:actions.openMenu')}</SheetTitle>
              <Logo />
              <nav className="flex flex-col gap-1" onClick={() => setMenuOpen(false)}>
                {publicNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-3 text-body-md font-medium text-foreground hover:bg-accent"
                  >
                    {t(`public.${item.label}`)}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2" onClick={() => setMenuOpen(false)}>
                <AccountActions stacked />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
