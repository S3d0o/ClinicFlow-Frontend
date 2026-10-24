import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { homePath } from '@/features/auth/model/access';
import { useSession } from '@/features/auth/hooks/use-session';
import { Button } from '@/shared/ui/button';

/** Shown when a signed-in user opens a screen their permissions don't cover. */
export default function ForbiddenPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
      <ShieldAlert aria-hidden="true" className="size-10 text-warning" />
      <h1 className="font-display text-headline-lg text-ink">{t('forbidden.title')}</h1>
      <p className="text-body-md text-muted-foreground">{t('forbidden.body')}</p>
      <Button asChild>
        <Link to={homePath(user)}>{t('forbidden.home')}</Link>
      </Button>
    </div>
  );
}
