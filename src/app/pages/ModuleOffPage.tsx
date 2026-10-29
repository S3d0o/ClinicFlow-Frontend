import { PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { homePath } from '@/features/auth/model/access';
import { useSession } from '@/features/auth/hooks/use-session';
import { Button } from '@/shared/ui/button';

/** Shown when a screen belongs to an add-on the clinic's plan doesn't include (ADR 0008 decision 10). */
export default function ModuleOffPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
      <PackageX aria-hidden="true" className="size-10 text-info" />
      <h1 className="font-display text-headline-lg text-ink">{t('moduleOff.title')}</h1>
      <p className="text-body-md text-muted-foreground">{t('moduleOff.body')}</p>
      <Button asChild>
        <Link to={homePath(user)}>{t('moduleOff.home')}</Link>
      </Button>
    </div>
  );
}
