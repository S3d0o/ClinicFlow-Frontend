import type { OtpTicket } from '@/features/auth/api/auth.service';
import type { Language } from '@/shared/i18n/languages';
import type { NotificationChannel, PatientProfile } from '../model/profile';

/**
 * The patient's own profile and settings (`/api/v2/me`, FR-ACC-05, FR-ACC-06, FR-NTF-04). Errors:
 * `Auth.PhoneAlreadyUsed`, `Otp.InvalidCode`, `Otp.TooManyAttempts`, `Auth.InvalidCredentials` (wrong
 * current password), `Profile.EmailRequired` (email channel without a confirmed email).
 */
export interface ProfileService {
  getMine(): Promise<PatientProfile>;
  updatePreferences(changes: { notificationChannel?: NotificationChannel; preferredLanguage?: Language }): Promise<PatientProfile>;
  /** Sends a code to the new number; it replaces the old one once the code is verified. */
  requestPhoneChange(newPhone: string): Promise<OtpTicket>;
  confirmPhoneChange(newPhone: string, code: string): Promise<PatientProfile>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}
