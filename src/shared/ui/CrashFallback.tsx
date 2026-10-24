import { useTranslation } from 'react-i18next';
import { Button } from './button';

/** What a crashed screen shows instead of a blank page. */
export function CrashFallback() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-headline-md text-ink">{t('crash.title')}</p>
      <p className="text-body-md text-muted-foreground">{t('crash.body')}</p>
      <Button onClick={() => window.location.reload()}>{t('crash.reload')}</Button>
    </div>
  );
}
