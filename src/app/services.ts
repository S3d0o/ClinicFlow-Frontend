import { createContext, useContext } from 'react';
import type {
  AccountService,
  AuthService,
  DemoAccountsService,
  InvitationService,
  MfaService,
  OtpService,
  PasswordResetService,
  RegistrationService,
} from '@/features/auth/api/auth.service';
import type { CatalogService } from '@/features/catalog/api/catalog.service';
import type { DirectoryService } from '@/features/doctors/api/directory.service';
import type { OrgService } from '@/features/org/api/org.service';
import type { ApplicationsService } from '@/features/recruitment/api/applications.service';

/**
 * Every backend capability the UI uses, as interfaces (ports). Screens and hooks depend on these,
 * never on an adapter: `createMockServices()` provides the in-memory backend today, and an HTTP
 * implementation of the same interfaces replaces it when the `/api/v2` endpoints exist.
 * Each phase adds the services its screens need.
 */
export interface Services {
  auth: AuthService;
  otp: OtpService;
  registration: RegistrationService;
  passwordReset: PasswordResetService;
  mfa: MfaService;
  invitations: InvitationService;
  account: AccountService;
  org: OrgService;
  catalog: CatalogService;
  directory: DirectoryService;
  applications: ApplicationsService;
  /** Only the mock backend offers demo accounts. */
  demoAccounts?: DemoAccountsService;
}

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
