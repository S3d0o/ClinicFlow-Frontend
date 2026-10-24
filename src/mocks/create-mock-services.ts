import type { Services } from '@/app/services';
import {
  createMockAccountService,
  createMockOtpService,
  createMockPasswordResetService,
  createMockRegistrationService,
} from '@/features/auth/api/account.mock';
import { createMockAuthService, createMockDemoAccountsService } from '@/features/auth/api/auth.mock';
import { createMockInvitationService, createMockMfaService } from '@/features/auth/api/staff-access.mock';
import { createMockCatalogService } from '@/features/catalog/api/catalog.mock';
import { createMockDirectoryService } from '@/features/doctors/api/directory.mock';
import { createMockOrgService } from '@/features/org/api/org.mock';
import { createMockApplicationsService } from '@/features/recruitment/api/applications.mock';
import { createMockDb, type MockDb } from './db';
import { createOtpStore } from './otp-store';
import { localSessionStore, type MockSessionStore } from './session-store';

export interface MockServicesOptions {
  db?: MockDb;
  session?: MockSessionStore;
  /** Simulated network delay per call; tests pass 0. */
  latencyMs?: number;
  /** The current time; tests pass a fixed clock. */
  now?: () => Date;
}

/** Wires every mock adapter to one shared in-memory database. */
export function createMockServices({
  now = () => new Date(),
  db = createMockDb(now()),
  session = localSessionStore,
  latencyMs = 250,
}: MockServicesOptions = {}): Services {
  const deps = { db, session, latencyMs, now, otp: createOtpStore(now) };
  return {
    auth: createMockAuthService(deps),
    otp: createMockOtpService(deps),
    registration: createMockRegistrationService(deps),
    passwordReset: createMockPasswordResetService(deps),
    mfa: createMockMfaService(deps),
    invitations: createMockInvitationService(deps),
    account: createMockAccountService(deps),
    org: createMockOrgService(deps),
    catalog: createMockCatalogService(deps),
    directory: createMockDirectoryService(deps),
    applications: createMockApplicationsService(deps),
    demoAccounts: createMockDemoAccountsService(deps),
  };
}
