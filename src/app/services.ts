import { createContext, useContext } from 'react';
import type { AuthService, DemoAccountsService } from '@/features/auth/api/auth.service';
import type { OrgService } from '@/features/org/api/org.service';

/**
 * Every backend capability the UI uses, as interfaces (ports). Screens and hooks depend on these,
 * never on an adapter: `createMockServices()` provides the in-memory backend today, and an HTTP
 * implementation of the same interfaces replaces it when the `/api/v2` endpoints exist.
 * Each phase adds the services its screens need.
 */
export interface Services {
  auth: AuthService;
  org: OrgService;
  /** Only the mock backend offers demo accounts. */
  demoAccounts?: DemoAccountsService;
}

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
