import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ComingSoonPage from '../pages/ComingSoonPage';
import type { ScreenRoute } from './types';

/** Renders a screen (or its placeholder) and keeps the browser tab title in the UI language. */
export function ScreenElement({ route }: { route: ScreenRoute }) {
  const { t } = useTranslation(['screens', 'common']);
  const title = t(`screens:${route.screen}`);

  useEffect(() => {
    document.title = `${title} · ${t('common:appName')}`;
  }, [title, t]);

  const Page = route.component;
  return Page ? <Page /> : <ComingSoonPage route={route} />;
}
