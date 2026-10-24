import type { Services } from '@/app/services';
import {
  createMockPatientAppointmentsService,
  createMockQueueStatusService,
  createMockReminderService,
} from '@/features/appointments/api/appointments.mock';
import {
  createMockAccountService,
  createMockOtpService,
  createMockPasswordResetService,
  createMockRegistrationService,
} from '@/features/auth/api/account.mock';
import { createMockAuthService, createMockDemoAccountsService } from '@/features/auth/api/auth.mock';
import { createMockInvitationService, createMockMfaService } from '@/features/auth/api/staff-access.mock';
import { createMockBillingService } from '@/features/billing/api/billing.mock';
import { createMockCatalogService } from '@/features/catalog/api/catalog.mock';
import { createMockDirectoryService } from '@/features/doctors/api/directory.mock';
import { createMockDocumentsService, createMockInsuranceService } from '@/features/documents/api/documents.mock';
import { createMockNotificationsService } from '@/features/notifications/api/notifications.mock';
import { createMockOrgService } from '@/features/org/api/org.mock';
import { createMockProfileService } from '@/features/profile/api/profile.mock';
import { createMockApplicationsService } from '@/features/recruitment/api/applications.mock';
import { createMockVisitsService } from '@/features/visits/api/visits.mock';
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
  /** Notification delivery after an action (default: 2 s with latency, at once without). */
  outboxDelayMs?: number;
  /** How often the simulated queue moves (default: 20 s with latency, never without). */
  queueTickMs?: number;
}

/** Wires every mock adapter to one shared in-memory database. */
export function createMockServices({
  now = () => new Date(),
  db = createMockDb(now()),
  session = localSessionStore,
  latencyMs = 250,
  outboxDelayMs = latencyMs > 0 ? 2000 : 0,
  queueTickMs = latencyMs > 0 ? 20_000 : 0,
}: MockServicesOptions = {}): Services {
  const deps = { db, session, latencyMs, now, outboxDelayMs, queueTickMs, otp: createOtpStore(now) };
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
    appointments: createMockPatientAppointmentsService(deps),
    queue: createMockQueueStatusService(deps),
    reminders: createMockReminderService(deps),
    visits: createMockVisitsService(deps),
    billing: createMockBillingService(deps),
    documents: createMockDocumentsService(deps),
    insurance: createMockInsuranceService(deps),
    profile: createMockProfileService(deps),
    notifications: createMockNotificationsService(deps),
    demoAccounts: createMockDemoAccountsService(deps),
  };
}
