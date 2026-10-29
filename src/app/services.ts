import { createContext, useContext } from 'react';
import type { PatientAppointmentsService, QueueStatusService, ReminderService } from '@/features/appointments/api/appointments.service';
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
import type { PatientBillingService } from '@/features/billing/api/billing.service';
import type { CashSessionService, CheckoutService } from '@/features/billing/api/checkout.service';
import type { CatalogService } from '@/features/catalog/api/catalog.service';
import type { DeskService } from '@/features/desk/api/desk.service';
import type { DoctorDayService, ScheduleService } from '@/features/doctor/api/doctor.service';
import type { DirectoryService } from '@/features/doctors/api/directory.service';
import type { DocumentsService, InsuranceService } from '@/features/documents/api/documents.service';
import type { EncountersService } from '@/features/encounters/api/encounters.service';
import type { DemoPlatformService, EntitlementsService } from '@/features/entitlements/api/entitlements.service';
import type { PatientHistoryService } from '@/features/history/api/history.service';
import type { NotificationsService } from '@/features/notifications/api/notifications.service';
import type { OrgService } from '@/features/org/api/org.service';
import type { PatientsService } from '@/features/patients/api/patients.service';
import type { ProfileService } from '@/features/profile/api/profile.service';
import type { QueueBoardService } from '@/features/queue/api/queue.service';
import type { ApplicationsService } from '@/features/recruitment/api/applications.service';
import type { TriageService } from '@/features/triage/api/triage.service';
import type { VisitsService } from '@/features/visits/api/visits.service';

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
  appointments: PatientAppointmentsService;
  queue: QueueStatusService;
  reminders: ReminderService;
  visits: VisitsService;
  billing: PatientBillingService;
  documents: DocumentsService;
  insurance: InsuranceService;
  profile: ProfileService;
  notifications: NotificationsService;
  // Front desk and nurse station (phase 3)
  patients: PatientsService;
  desk: DeskService;
  queueBoard: QueueBoardService;
  triage: TriageService;
  checkout: CheckoutService;
  cashSessions: CashSessionService;
  // Doctor workspace (phase 4)
  encounters: EncountersService;
  doctorDay: DoctorDayService;
  schedule: ScheduleService;
  history: PatientHistoryService;
  // Plans and modules (release R1)
  entitlements: EntitlementsService;
  /** Only the mock backend offers demo accounts. */
  demoAccounts?: DemoAccountsService;
  /** Only the mock backend lets the demo switch the clinic's plan (the operator console is R4). */
  demoPlatform?: DemoPlatformService;
}

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
