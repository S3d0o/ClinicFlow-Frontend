import { HashRouter } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import { PreviewRibbon } from './PreviewRibbon';
import { AppRoutes } from './routes/AppRoutes';
import type { Services } from './services';

/**
 * The app. Hash routing is required: backend emails link to `/#/reset-password` and
 * `/#/confirm-email` (API contract §8).
 */
export function App({ services }: { services: Services }) {
  return (
    <HashRouter>
      <AppProviders services={services}>
        <PreviewRibbon />
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  );
}
