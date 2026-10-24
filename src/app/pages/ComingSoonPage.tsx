import { Hammer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/PageHeader';
import type { ScreenRoute } from '../routes/types';

/** Stands in for a designed screen until its phase builds it, naming the design it will follow. */
export default function ComingSoonPage({ route }: { route: ScreenRoute }) {
  const { t } = useTranslation(['screens', 'common']);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('common:comingSoon.eyebrow', { phase: route.phase })} title={t(`screens:${route.screen}`)} />
      <Card className="flex items-start gap-4 p-6">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-highlight/10 text-highlight-strong">
          <Hammer className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-body-md text-foreground">{t('common:comingSoon.body', { phase: route.phase })}</p>
          {route.design && (
            <p className="text-body-sm text-muted-foreground">
              {t('common:comingSoon.design')} <bdi dir="ltr">design-v2/screens/{route.design}</bdi>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
