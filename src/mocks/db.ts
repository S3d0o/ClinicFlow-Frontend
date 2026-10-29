import type { PriceListItem, Service, Specialty } from '@/features/catalog/model/catalog';
import type { Payer } from '@/features/documents/model/documents';
import type { Drug, EncounterTemplate, Icd10Code } from '@/features/encounters/model/encounter';
import type { Plan } from '@/features/entitlements/api/entitlements.service';
import type { Holiday } from '@/features/org/model/branch-admin';
import type { OrganizationProfile, OrganizationSettings } from '@/features/org/model/organization';
import type { Branch } from '@/features/org/model/branch';
import { renderNotification } from './notifications';
import { applicationsSeed, type ApplicationRecord } from './seed/applications';
import { clinicalSeed, drugsSeed, icd10Seed, templatesSeed, type EncounterRecord, type LeaveRecord } from './seed/clinical';
import { branchesSeed } from './seed/branches';
import { priceListSeed, servicesSeed, specialtiesSeed } from './seed/catalog';
import { doctorsSeed, type DoctorSeed } from './seed/doctors';
import {
  deskPatientsSeed,
  doctorRoomsSeed,
  drawersSeed,
  frontDeskSeed,
  roomsSeed,
  type CashSessionRecord,
  type DoctorRoomSeed,
  type DrawerSeed,
  type PaymentRecord,
  type RoomSeed,
} from './seed/front-desk';
import { invitationsSeed, type InvitationSeed } from './seed/invitations';
import {
  patientPortalSeed,
  payersSeed,
  type AppointmentRecord,
  type DocumentRecord,
  type InvoiceRecord,
  type NotificationRecord,
  type PatientRecordSeed,
  type PolicyRecord,
  type VisitRecord,
} from './seed/patient-portal';
import { reviewsSeed, type ReviewSeed } from './seed/reviews';
import { plansSeed, subscriptionSeed, type SubscriptionRecord } from './seed/subscription';
import { branchHoursSeed, holidaysSeed, organizationSeed, settingsSeed, type BranchHoursRecord } from './seed/organization';
import { usersSeed, type UserSeed } from './seed/users';

/** An email the mock "sent". The demo shows its link, since no real email leaves the browser. */
export interface SentEmail {
  to: string;
  kind: 'PasswordReset' | 'EmailConfirmation' | 'ApplicationStage';
  /** The app path the email links to, if any. */
  path?: string;
  sentAt: string;
}

/** A single-use token from an emailed link (confirm email, reset password). */
export interface EmailToken {
  token: string;
  userId: string;
  purpose: 'ConfirmEmail' | 'ResetPassword';
  expiresAt: string;
}

/**
 * The in-memory backend the mock adapters read and write. Every adapter gets the same instance, so a
 * change made on one screen (a booking, a check-in) shows up on the others, like with a real API.
 * Each phase adds its tables here, with seed data in `seed/`.
 */
export interface MockDb {
  branches: Branch[];
  users: UserSeed[];
  specialties: Specialty[];
  services: Service[];
  priceList: PriceListItem[];
  doctors: DoctorSeed[];
  reviews: ReviewSeed[];
  applications: ApplicationRecord[];
  invitations: InvitationSeed[];
  /** Uploaded files by id (seeded files are made up on download). */
  files: Map<string, Blob>;
  sentEmails: SentEmail[];
  emailTokens: EmailToken[];
  patients: PatientRecordSeed[];
  appointments: AppointmentRecord[];
  visits: VisitRecord[];
  invoices: InvoiceRecord[];
  documents: DocumentRecord[];
  policies: PolicyRecord[];
  payers: Payer[];
  notifications: NotificationRecord[];
  /** Reminder message links (`/r/:token`) → appointment. */
  reminderTokens: { token: string; appointmentId: string }[];
  rooms: RoomSeed[];
  doctorRooms: DoctorRoomSeed[];
  drawers: DrawerSeed[];
  payments: PaymentRecord[];
  cashSessions: CashSessionRecord[];
  /** Who listens to queue changes per branch: the stand-in for the `/hubs/queue` SignalR hub. */
  queueListeners: Set<(branchId: string) => void>;
  icd10: Icd10Code[];
  drugs: Drug[];
  encounterTemplates: EncounterTemplate[];
  encounters: EncounterRecord[];
  leaveRequests: LeaveRecord[];
  /** The platform's plans and the clinic's subscription (ADR 0008). */
  plans: Plan[];
  subscription: SubscriptionRecord;
  /** Branch opening hours, holidays, the organization profile and its settings (FR-ORG-01…05). */
  branchHours: BranchHoursRecord[];
  holidays: Holiday[];
  organization: OrganizationProfile;
  settings: OrganizationSettings;
}

/** A fresh copy of the seed data (tests get an isolated database each). Dated seeds are relative to `now`. */
export function createMockDb(now: Date = new Date()): MockDb {
  const fixed = structuredClone({
    branches: branchesSeed,
    users: usersSeed,
    specialties: specialtiesSeed,
    services: servicesSeed,
    priceList: priceListSeed,
    doctors: doctorsSeed,
    payers: payersSeed,
    rooms: roomsSeed,
    doctorRooms: doctorRoomsSeed,
    drawers: drawersSeed,
    deskPatients: deskPatientsSeed,
    icd10: icd10Seed,
    drugs: drugsSeed,
    encounterTemplates: templatesSeed,
    plans: plansSeed,
    branchHours: branchHoursSeed,
    organization: organizationSeed,
    settings: settingsSeed,
  });
  const { notificationEvents, ...portal } = patientPortalSeed(now);
  const desk = frontDeskSeed(now);
  const clinical = clinicalSeed(now);
  const { deskPatients, ...reference } = fixed;
  const appointments = [...portal.appointments, ...desk.appointments, ...clinical.appointments];
  const db: MockDb = {
    ...reference,
    ...portal,
    patients: [...portal.patients, ...deskPatients],
    appointments,
    // Desk visits that fall outside today (the demo opened very early or late) have no encounter either
    encounters: clinical.encounters.filter((e) => appointments.some((a) => a.id === e.appointmentId)),
    leaveRequests: clinical.leaveRequests,
    invoices: [...portal.invoices, ...desk.invoices],
    payments: desk.payments,
    cashSessions: desk.cashSessions,
    queueListeners: new Set(),
    reviews: reviewsSeed(now),
    applications: applicationsSeed(now),
    invitations: invitationsSeed(now),
    subscription: subscriptionSeed(now),
    holidays: holidaysSeed(now),
    files: new Map(),
    sentEmails: [],
    emailTokens: [],
    notifications: [],
  };
  // Seeded notifications are rendered like new ones, in the patient's language
  db.notifications = notificationEvents.map((event) => {
    const appointment = db.appointments.find((a) => a.id === event.appointmentId)!;
    const invoice = /Invoice|Payment/.test(event.type)
      ? db.invoices.find((i) => i.patientUserId === appointment.patientUserId && i.doctorName === appointment.doctorName)
      : undefined;
    const notification = renderNotification(db, appointment.patientUserId!, event.type, { appointment, invoice, amount: invoice?.total }, event.at);
    return { ...notification, isRead: event.read };
  });
  return db;
}

/** Resolves after `ms` milliseconds, to make loading states visible like a real network. */
export const delay = (ms: number) =>
  ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

/** What every mock adapter is built from. */
export interface MockDeps {
  db: MockDb;
  latencyMs: number;
  /** The current time; tests pass a fixed clock. */
  now: () => Date;
  /** How long after an action its notification arrives (the outbox, about 2 s; 0 in tests). */
  outboxDelayMs: number;
  /** How often the simulated queue moves forward (0 keeps it still, as in tests). */
  queueTickMs: number;
  /** How long an uploaded file waits for its virus scan before it can be downloaded (0 in tests by default). */
  scanDelayMs: number;
}
