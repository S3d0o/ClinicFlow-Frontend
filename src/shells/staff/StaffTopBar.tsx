import { useState, type FormEvent, type ReactNode } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { Button } from '@/shared/ui/button';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';

interface StaffTopBarProps {
  /** The sidebar content, shown in a sheet below `lg`. */
  sidebar: (close: () => void) => ReactNode;
  /** Patient search is shown only to users who can open the patient list. */
  canSearchPatients: boolean;
}

/** Search, language, notifications, and the menu button on smaller screens. */
export function StaffTopBar({ sidebar, canSearchPatients }: StaffTopBarProps) {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const search = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate(`/desk/patients?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('actions.openMenu')}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="w-sidebar max-w-[85vw] p-0">
            <SheetTitle className="sr-only">{t('actions.openMenu')}</SheetTitle>
            {sidebar(() => setMenuOpen(false))}
          </SheetContent>
        </Sheet>

        {canSearchPatients && (
          <form role="search" onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
            <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('topbar.search')}
              aria-label={t('topbar.search')}
              className="h-10 w-full rounded-lg border border-input bg-background ps-9 pe-3 text-body-md outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </form>
        )}

        <div className="ms-auto flex items-center gap-2">
          <LanguageToggle />
          <Button asChild variant="ghost" size="icon" aria-label={t('topbar.notifications')}>
            <Link to="/notifications">
              <Bell />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
