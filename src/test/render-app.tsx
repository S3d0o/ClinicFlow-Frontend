import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/AppProviders';
import { createQueryClient } from '@/app/query-client';
import { AppRoutes } from '@/app/routes/AppRoutes';
import type { PlanCode } from '@/features/entitlements/api/entitlements.service';
import { createMockServices } from '@/mocks/create-mock-services';
import { createMockDb } from '@/mocks/db';
import { memorySessionStore } from '@/mocks/session-store';

interface Options {
  /** The page to open. */
  path?: string;
  /** A seeded user id (`src/mocks/seed/users.ts`) to start signed in as. */
  signedInAs?: string;
  /** How long an upload waits for its virus scan (default 0: scanned at once). */
  scanDelayMs?: number;
  /** The clinic's plan, with no extras (default: the seed's Full plan plus recruitment). */
  plan?: PlanCode;
}

/** Renders the whole app (routes, shells, guards) on a fresh mock backend with no network delay. */
export function renderApp({ path = '/', signedInAs, scanDelayMs, plan }: Options = {}) {
  const db = createMockDb();
  if (plan) db.subscription = { ...db.subscription, planCode: plan, overrides: [] };
  const services = createMockServices({ db, latencyMs: 0, session: memorySessionStore(signedInAs ?? null), scanDelayMs });
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
