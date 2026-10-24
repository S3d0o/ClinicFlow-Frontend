import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicNav } from '@/app/navigation';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { useLanguage } from '@/shared/i18n/use-language';
import { Logo } from '@/shared/ui/Logo';

export function PublicFooter() {
  const { t } = useTranslation(['common', 'nav']);
  const { language } = useLanguage();
  const { data: branches = [] } = useBranches();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-body-md text-muted-foreground">{t('footer.tagline')}</p>
        </div>
        <div className="space-y-3">
          <p className="eyebrow">{t('nav:public.branches')}</p>
          <ul className="space-y-2 text-body-md">
            {branches.map((branch) => (
              <li key={branch.id}>{branchName(branch, language)}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <p className="eyebrow">{t('appName')}</p>
          <ul className="space-y-2 text-body-md">
            {publicNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground hover:text-primary">
                  {t(`nav:public.${item.label}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-body-sm text-muted-foreground sm:px-6 lg:px-8">
          {t('footer.rights', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
