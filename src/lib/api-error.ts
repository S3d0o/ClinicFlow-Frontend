import { isAxiosError } from 'axios';

// Error body shapes from docs/API_CONTRACT.md §3.1:
// A. ProblemDetails: `title` is the error code, `detail` is a human-readable message.
// B/C. Validation: `title` is generic; `errors` maps a field name (B) or an error code (C) to messages.
interface ApiErrorBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

// User-facing text for error codes in API contract §3.3.
const messagesByCode: Record<string, string> = {
  'Auth.InvalidCredentials': 'Incorrect email or password.',
  'Auth.AccountLockedOut': 'Too many failed sign-in attempts. Your account is locked for 15 minutes.',
  'Auth.AccountNotActive': 'This account has been suspended.',
  'Auth.EmailNotConfirmed': 'Please confirm your email address before signing in.',
  'Auth.InvalidRefreshToken': 'Your session has expired. Please sign in again.',
  'Auth.UserNotFound': 'This account could not be found.',
  'Auth.EmailAlreadyExists': 'An account with this email already exists.',
  'Auth.InvalidEmailConfirmationToken': 'This confirmation link is invalid or has expired.',
  'Auth.InvalidPasswordResetToken':
    'This reset link is invalid or has expired, or the new password does not meet the requirements.',
  'Doctor.NotFound': 'This doctor could not be found.',
  'Doctor.ProfileNotFound': 'Your doctor profile could not be found.',
  'Doctor.ScheduleNotFound': 'This schedule could not be found.',
  'Doctor.ScheduleDayAlreadyExists': 'You already have a schedule for this day.',
  'Doctor.InvalidScheduleTime': 'The end time must be after the start time and fit at least one slot.',
  'Patient.ProfileNotFound': 'Your patient profile could not be found.',
  'Appointment.NotFound': 'This appointment could not be found.',
  'Appointment.SlotNotFound': 'This time slot no longer exists. Please pick another time.',
  'Appointment.SlotNotAvailable': 'This time slot is no longer available. Please pick another time.',
  'Appointment.SlotAlreadyBooked': 'Someone else just booked this time slot. Please pick another time.',
  'Appointment.SlotInPast': 'This time slot has already started. Please pick a later time.',
  'Appointment.CancellationWindowExpired':
    'Appointments can only be cancelled at least 2 hours before they start.',
  'Appointment.AlreadyCancelled': 'This appointment has already been cancelled.',
  'Appointment.AlreadyCompleted': 'This appointment has already been completed.',
  'Appointment.CannotCompleteCancelled': 'A cancelled appointment cannot be completed.',
  'Appointment.DoctorNotesNotAllowed': 'Notes cannot be added to a cancelled appointment.',
  'Appointment.Unauthorized': 'You do not have access to this appointment.',
  'Appointment.ReviewAlreadyExists': 'You have already reviewed this appointment.',
  'Appointment.ReviewNotAllowed': 'You can only review completed appointments.',
  'Review.NotFound': 'This review could not be found.',
  'Review.Unauthorized': 'You can only delete your own reviews.',
  'Notification.NotFound': 'This notification could not be found.',
  'Notification.Unauthorized': 'You do not have access to this notification.',
  'Profile.NotFound': 'Your profile could not be found.',
  'Specialty.NotFound': 'This specialty could not be found.',
  'Specialty.NameAlreadyExists': 'A specialty with this name already exists.',
  'Specialty.HasAssignedDoctors': 'This specialty cannot be deleted because doctors are assigned to it.',
  'Admin.DoctorAlreadyApproved': 'This doctor is already approved.',
  'Admin.DoctorAlreadySuspended': 'This doctor is already suspended.',
};

// Codes whose `detail` carries more useful information than our generic text.
const codesPreferringDetail = new Set(['Auth.RegistrationFailed', 'Profile.UpdateFailed']);

const isErrorCode = (value: string) => /^[A-Z][A-Za-z]*\.[A-Z][A-Za-z]*$/.test(value);

const getBody = (error: unknown): ApiErrorBody | undefined => {
  if (!isAxiosError(error)) return undefined;
  const data: unknown = error.response?.data;
  return data && typeof data === 'object' ? (data as ApiErrorBody) : undefined;
};

/** The API error code (e.g. `Appointment.SlotAlreadyBooked`), from `title` or a shape C `errors` key. */
export function getApiErrorCode(error: unknown): string | undefined {
  const body = getBody(error);
  if (!body) return undefined;
  if (body.title && isErrorCode(body.title)) return body.title;
  return Object.keys(body.errors ?? {}).find(isErrorCode);
}

/** Every user-facing message for a failed request, most specific first. */
export function getApiErrorMessages(error: unknown, fallback: string): string[] {
  if (isAxiosError(error) && !error.response) {
    return ['Could not reach the server. Check your connection and try again.'];
  }

  const body = getBody(error);
  const code = getApiErrorCode(error);

  if (code && !codesPreferringDetail.has(code) && messagesByCode[code]) {
    return [messagesByCode[code]];
  }
  if (body?.detail) return [body.detail];

  const validationMessages = Object.values(body?.errors ?? {}).flat().filter(Boolean);
  if (validationMessages.length > 0) return validationMessages;

  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 403) return ['You do not have permission to do that.'];

  return [fallback];
}

/** A single user-facing message for a failed request. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessages(error, fallback)[0];
}
