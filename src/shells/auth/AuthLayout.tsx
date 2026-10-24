import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { Logo } from '@/shared/ui/Logo';
import { SkipLink } from '@/shared/ui/SkipLink';
import { ScreenOutlet } from '../ScreenOutlet';

/** Sign-in, sign-up and recovery screens: a slim top bar and a centred column. */
export function AuthLayout() {
  const { t } = useTranslation(['screens', 'common']);
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="ms-auto flex items-center gap-3">
            <Link to="/" className="hidden items-center gap-1.5 text-label-md text-muted-foreground hover:text-primary sm:inline-flex">
              <ArrowLeft aria-hidden="true" className="rtl-flip size-4" />
              {t('screens:landing')}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>
      <ScreenOutlet className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:py-14" />
    </div>
  );
}
