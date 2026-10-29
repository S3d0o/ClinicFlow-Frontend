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
import { createMockCashSessionService, createMockCheckoutService } from '@/features/billing/api/checkout.mock';
import { createMockCatalogService } from '@/features/catalog/api/catalog.mock';
import { createMockSpecialtyAdminService } from '@/features/catalog/api/specialty-admin.mock';
import { createMockDeskService } from '@/features/desk/api/desk.mock';
import { createMockDoctorDayService, createMockScheduleService } from '@/features/doctor/api/doctor.mock';
import { createMockDirectoryService } from '@/features/doctors/api/directory.mock';
import { createMockDocumentsService, createMockInsuranceService } from '@/features/documents/api/documents.mock';
import { createMockEncountersService } from '@/features/encounters/api/encounters.mock';
import { createMockDemoPlatformService, createMockEntitlementsService } from '@/features/entitlements/api/entitlements.mock';
import { createMockPatientHistoryService } from '@/features/history/api/history.mock';
import { createMockNotificationsService } from '@/features/notifications/api/notifications.mock';
import { createMockBranchAdminService, createMockOrganizationService } from '@/features/org/api/org-admin.mock';
import { createMockOrgService } from '@/features/org/api/org.mock';
import { createMockPatientsService } from '@/features/patients/api/patients.mock';
import { createMockProfileService } from '@/features/profile/api/profile.mock';
import { createMockQueueBoardService } from '@/features/queue/api/queue.mock';
import { createMockRolesService, createMockStaffService } from '@/features/staff/api/staff.mock';
import { createMockApplicationsService } from '@/features/recruitment/api/applications.mock';
import { createMockTriageService } from '@/features/triage/api/triage.mock';
import { createMockVisitsService } from '@/features/visits/api/visits.mock';
import { createMockDb, type MockDb } from './db';
import { createOtpStore } from './otp-store';
import { startQueueDemo } from './queue-demo';
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
  /** How often the demo doctors move the queue (default: 20 s with latency, never without). */
  queueTickMs?: number;
  /** The virus scan of an upload (default: 5 s with latency, at once without). */
  scanDelayMs?: number;
  /** Called by "Reset demo data" after signing out, to forget the saved database (`persistence.ts`). */
  onResetDemo?: () => void;
}

/** Wires every mock adapter to one shared in-memory database. */
export function createMockServices({
  now = () => new Date(),
  db = createMockDb(now()),
  session = localSessionStore,
  latencyMs = 250,
  outboxDelayMs = latencyMs > 0 ? 2000 : 0,
  queueTickMs = latencyMs > 0 ? 20_000 : 0,
  scanDelayMs = latencyMs > 0 ? 5000 : 0,
  onResetDemo,
}: MockServicesOptions = {}): Services {
  const deps = { db, session, latencyMs, now, outboxDelayMs, queueTickMs, scanDelayMs, otp: createOtpStore(now) };
  startQueueDemo(deps);
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
    patients: createMockPatientsService(deps),
    desk: createMockDeskService(deps),
    queueBoard: createMockQueueBoardService(deps),
    triage: createMockTriageService(deps),
    checkout: createMockCheckoutService(deps),
    cashSessions: createMockCashSessionService(deps),
    encounters: createMockEncountersService(deps),
    doctorDay: createMockDoctorDayService(deps),
    schedule: createMockScheduleService(deps),
    history: createMockPatientHistoryService(deps),
    staff: createMockStaffService(deps),
    branchAdmin: createMockBranchAdminService(deps),
    organization: createMockOrganizationService(deps),
    specialtyAdmin: createMockSpecialtyAdminService(deps),
    roles: createMockRolesService(deps),
    entitlements: createMockEntitlementsService(deps),
    demoAccounts: createMockDemoAccountsService({ ...deps, onResetDemo }),
    demoPlatform: createMockDemoPlatformService(deps),
  };
}
