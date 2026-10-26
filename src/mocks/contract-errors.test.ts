import { describe, expect, it } from 'vitest';
import enCommon from '@/shared/i18n/locales/en/common.json';

// The mocks may only throw the error codes API_CONTRACT.md §13.3–§13.8 lists for the calls of their
// service, so screens never handle a code the real API can't send. One factory function is one port.
// Codes written as string literals are checked; a code computed at runtime (`checkDocument`'s file
// checks) isn't seen here and is covered by that adapter's own tests.

/** Not codes of the API: the HTTP adapters produce them from a 401 without a code (§13.1, shape E) and a 400 validation error on `phone`. */
const ADAPTER_CODES = ['Auth.Unauthorized', 'Validation.InvalidPhone'];

const OTP = ['Otp.InvalidCode', 'Otp.TooManyAttempts', 'Otp.ResendTooSoon'];
const APPOINTMENT = ['Appointment.Unauthorized', 'Appointment.NotFound'];

/** §13 codes per mock factory. `null` marks a demo-only service, which no API endpoint stands behind. */
const CONTRACT: Record<string, Record<string, string[] | null>> = {
  'features/auth/api/auth.mock.ts': {
    // §13.3 login, mfa, refresh-token, logout
    createMockAuthService: [
      'Auth.InvalidCredentials', 'Auth.AccountNotActive', 'Auth.PhoneNotVerified', 'Auth.AccountLockedOut', 'RateLimit.Exceeded',
      'Auth.InvalidMfaCode', 'Auth.MfaChallengeExpired', 'Auth.InvalidRefreshToken',
    ],
    createMockDemoAccountsService: null,
  },
  'features/auth/api/account.mock.ts': {
    createMockOtpService: [...OTP, 'Messaging.PhoneUnreachable'], // §13.3 otp/send
    // §13.3 register, register/verify, confirm-email
    createMockRegistrationService: [...OTP, 'Auth.EmailAlreadyExists', 'RateLimit.Exceeded', 'Messaging.PhoneUnreachable', 'Auth.InvalidEmailConfirmationToken'],
    // §13.3 password/forgot, check-code, reset-by-otp, reset
    createMockPasswordResetService: ['Otp.InvalidCode', 'Otp.TooManyAttempts', 'RateLimit.Exceeded', 'Auth.InvalidPasswordResetToken'],
    createMockAccountService: ['Auth.EmailAlreadyExists', 'Auth.InvalidEmailConfirmationToken'], // §13.4 me/email, §13.3 confirm-email
  },
  'features/auth/api/staff-access.mock.ts': {
    createMockMfaService: ['Auth.InvalidMfaCode'], // §13.3 mfa/enroll, mfa/confirm
    createMockInvitationService: ['Invitation.NotFound', 'Invitation.Expired', 'Auth.PhoneAlreadyUsed'], // §13.3 invitations
  },
  'features/org/api/org.mock.ts': { createMockOrgService: [] }, // §13.5 public/branches
  'features/catalog/api/catalog.mock.ts': { createMockCatalogService: [] }, // §13.5 public/specialties, services
  'features/doctors/api/directory.mock.ts': { createMockDirectoryService: ['Doctor.NotFound', 'Branch.NotFound'] }, // §13.5
  'features/recruitment/api/applications.mock.ts': {
    // §13.6
    createMockApplicationsService: [
      'DoctorApplication.CvRequired', 'File.TypeNotAllowed', 'File.TooLarge', 'Auth.PhoneNotVerified', 'Auth.EmailNotConfirmed',
      'DoctorApplication.AlreadyOpen', 'DoctorApplication.ReapplyTooSoon', 'DoctorApplication.NotFound',
      'DoctorApplication.InvalidStatusTransition', 'File.NotFound', 'File.NotScanned',
    ],
  },
  'features/appointments/api/appointments.mock.ts': {
    // §13.7 appointments
    createMockPatientAppointmentsService: [
      ...APPOINTMENT, 'Consent.Required', 'Appointment.SlotInPast', 'Booking.ServiceNotOffered', 'Auth.PhoneNotVerified',
      'Appointment.SlotNotFound', 'Slot.CapacityReached', 'Idempotency.KeyReused', 'Appointment.CancellationWindowExpired',
      'Appointment.InvalidStatusTransition', 'Appointment.ReviewNotAllowed', 'Appointment.ReviewAlreadyExists',
      'Deposit.NotOffered', 'Deposit.AlreadyPaid', 'Payment.GatewayUnavailable',
    ],
    createMockQueueStatusService: APPOINTMENT, // §13.7 queue and /hubs/queue
    createMockReminderService: ['Reminder.LinkInvalid', 'Appointment.InvalidStatusTransition', 'Appointment.CancellationWindowExpired'], // §13.7 reminders
  },
  'features/visits/api/visits.mock.ts': { createMockVisitsService: ['Visit.NotFound', 'Visit.NoPrescription'] }, // §13.8
  'features/billing/api/billing.mock.ts': {
    createMockBillingService: ['Invoice.NotFound', 'Invoice.NothingDue', 'Idempotency.KeyReused', 'Payment.GatewayUnavailable'], // §13.8
  },
  'features/documents/api/documents.mock.ts': {
    createMockDocumentsService: ['File.TypeNotAllowed', 'File.TooLarge', 'File.NotFound', 'File.NotScanned', 'Document.SharedWithDoctor'], // §13.8
    createMockInsuranceService: ['File.TypeNotAllowed', 'File.TooLarge', 'Payer.NotFound'], // §13.8 policies
  },
  'features/profile/api/profile.mock.ts': {
    // §13.4
    createMockProfileService: [...OTP, 'Profile.EmailRequired', 'Auth.PhoneAlreadyUsed', 'Auth.EmailAlreadyExists', 'Auth.InvalidCredentials', 'Patient.ProfileNotFound'],
  },
  'features/notifications/api/notifications.mock.ts': {
    createMockNotificationsService: ['Notification.Unauthorized', 'Notification.NotFound'], // §13.8
  },
};

/** Shared mock modules and the codes they may throw (they serve the services above). */
const SHARED: Record<string, string[]> = {
  'mocks/booking.ts': CONTRACT['features/appointments/api/appointments.mock.ts'].createMockPatientAppointmentsService!,
  'mocks/otp-store.ts': OTP,
};

const sources = import.meta.glob(['/src/features/**/api/*.mock.ts', '/src/mocks/*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const source = (path: string) => {
  const text = sources[`/src/${path}`];
  if (text === undefined) throw new Error(`No source for ${path}`);
  return text;
};

/** Every `Module.Reason` string literal: the error codes a piece of mock code can throw. */
const codesIn = (code: string) => [...new Set([...code.matchAll(/['"]([A-Z][A-Za-z]+\.[A-Z][A-Za-z]+)['"]/g)].map((m) => m[1]))];

/** The file split into its exported factories; code before the first one (shared helpers) is returned apart. */
function factories(text: string) {
  const parts = text.split(/^export function (createMock\w+)/m);
  const blocks: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 2) blocks[parts[i]] = parts[i + 1];
  return { preamble: parts[0], blocks };
}

describe('mock error codes match API_CONTRACT.md §13', () => {
  for (const [file, expected] of Object.entries(CONTRACT)) {
    it(file, () => {
      const { preamble, blocks } = factories(source(file));
      expect(Object.keys(blocks).sort()).toEqual(Object.keys(expected).sort());
      const fileWide = [...ADAPTER_CODES, ...Object.values(expected).flatMap((codes) => codes ?? [])];
      expect(codesIn(preamble).filter((c) => !fileWide.includes(c))).toEqual([]);
      for (const [factory, allowed] of Object.entries(expected)) {
        if (allowed === null) continue;
        const extra = codesIn(blocks[factory]).filter((c) => ![...ADAPTER_CODES, ...allowed].includes(c));
        expect({ factory, extra }).toEqual({ factory, extra: [] });
      }
    });
  }

  for (const [file, allowed] of Object.entries(SHARED)) {
    it(file, () => {
      expect(codesIn(source(file)).filter((c) => !allowed.includes(c))).toEqual([]);
    });
  }
});

describe('every §13 code these services can return has a message', () => {
  // The HTTP client handles a bad refresh token itself (it signs out), so its code is never shown
  const handledByClient = ['Auth.InvalidRefreshToken'];
  const all = new Set(Object.values(CONTRACT).flatMap((services) => Object.values(services).flatMap((codes) => codes ?? [])));
  // `errors.generic` is a string beside the per-module groups
  const errors: Record<string, unknown> = enCommon.errors;

  it('in common:errors', () => {
    const missing = [...all].filter((code) => !handledByClient.includes(code)).filter((code) => {
      const [module, reason] = code.split('.');
      const group = errors[module];
      return !(typeof group === 'object' && group !== null && reason in group);
    });
    expect(missing).toEqual([]);
  });
});
