import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/AppProviders';
import { createQueryClient } from '@/app/query-client';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { createMockServices } from '@/mocks/create-mock-services';
import { memorySessionStore } from '@/mocks/session-store';

interface Options {
  /** The page to open. */
  path?: string;
  /** A seeded user id (`src/mocks/seed/users.ts`) to start signed in as. */
  signedInAs?: string;
  /** How long an upload waits for its virus scan (default 0: scanned at once). */
  scanDelayMs?: number;
}

/** Renders the whole app (routes, shells, guards) on a fresh mock backend with no network delay. */
export function renderApp({ path = '/', signedInAs, scanDelayMs }: Options = {}) {
  const services = createMockServices({ latencyMs: 0, session: memorySessionStore(signedInAs ?? null), scanDelayMs });
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });

  return {
    services,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <AppProviders services={services} queryClient={queryClient}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    ),
  };
}
