import type { Language } from '@/shared/i18n/languages';
import type { CurrentUser, Role, RoleAssignment } from '../model/user';

export interface SignInRequest {
  /** A phone number or an email address (FR-ACC-03). */
  identifier: string;
  password: string;
}

/** Who is signing in, shown on the two-step screen ("mona.samir@… · Receptionist"). */
export interface MfaChallenge {
  id: string;
  identifier: string;
  roleLabel: Role;
}

/** Staff accounts need a second step (FR-STF-07); patients and applicants are signed in directly. */
export type SignInResult = { status: 'signed-in'; user: CurrentUser } | { status: 'mfa-required'; challenge: MfaChallenge };

export type MfaProof = { code: string } | { recoveryCode: string };

/**
 * Sign-in and session (port), `/api/v2/auth/login`, `/auth/mfa`, `/me`, `/auth/logout`. Errors:
 * `Auth.InvalidCredentials` (same for an unknown account), `Auth.AccountLockedOut` with `retryAt`,
 * `Auth.PhoneNotVerified`, `Auth.InvalidMfaCode`, `Auth.MfaChallengeExpired`.
 */
export interface AuthService {
  getCurrentUser(): Promise<CurrentUser | null>;
  signIn(request: SignInRequest): Promise<SignInResult>;
  verifyMfa(challengeId: string, proof: MfaProof): Promise<CurrentUser>;
  signOut(): Promise<void>;
}

export type OtpPurpose = 'SignUp' | 'PasswordReset' | 'ChangePhone';

/** A code was sent (or, for unknown numbers, the same answer is given: 08 §2). */
export interface OtpTicket {
  /** E.164 */
  phone: string;
  expiresAt: string;
  /** A new code can be requested from then on (60 s, FR-ACC-02). */
  resendAt: string;
}

/** SMS one-time codes (`/api/v2/auth/otp/send`). Errors: `Otp.ResendTooSoon`, `Otp.TooManyAttempts` with `retryAt`. */
export interface OtpService {
  send(phone: string, purpose: OtpPurpose): Promise<OtpTicket>;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  preferredLanguage: Language;
}

/** Patient sign-up (FR-ACC-01, FR-ACC-02): register sends a code; verifying it signs the user in. */
export interface RegistrationService {
  register(request: RegisterRequest): Promise<OtpTicket>;
  /** Errors: `Otp.InvalidCode` with `attemptsLeft`, `Otp.TooManyAttempts`. */
  verifyPhone(phone: string, code: string): Promise<CurrentUser>;
}

/** Password reset by SMS code or email link (FR-ACC-04). Every success revokes all sessions. */
export interface PasswordResetService {
  /** Always succeeds, whether or not the email has an account (08 §2). */
  requestEmailLink(email: string): Promise<void>;
  /** Checks an SMS code without using it up, before asking for the new password. */
  checkCode(phone: string, code: string): Promise<void>;
  resetWithCode(phone: string, code: string, newPassword: string): Promise<void>;
  /** From the emailed link (`/#/reset-password?email=…&token=…`, API contract §8). */
  resetWithEmailToken(email: string, token: string, newPassword: string): Promise<void>;
}

/** TOTP authenticator setup (`/auth/mfa/enroll`, `/auth/mfa/confirm`). */
export interface MfaEnrollment {
  /** Base32 key for manual entry. */
  secret: string;
  /** `otpauth://totp/...`, shown as a QR code. */
  otpauthUri: string;
  recoveryCodes: string[];
}

export interface MfaService {
  startEnrollment(): Promise<MfaEnrollment>;
  /** Errors: `Auth.InvalidMfaCode`. */
  confirmEnrollment(code: string): Promise<CurrentUser>;
}

/** A staff invitation (FR-STF-01), read from its link before accepting. */
export interface Invitation {
  email: string;
  fullName: string;
  roles: RoleAssignment[];
  invitedByName: string;
  expiresAt: string;
}

export interface AcceptInvitationRequest {
  fullName: string;
  phone: string;
  password: string;
}

/** Errors: `Invitation.NotFound` (unknown, used or revoked), `Invitation.Expired`. */
export interface InvitationService {
  get(token: string): Promise<Invitation>;
  /** Activates the staff member and signs them in; two-step setup comes next (FR-STF-02, FR-STF-07). */
  accept(token: string, request: AcceptInvitationRequest): Promise<CurrentUser>;
}

/** The signed-in user's email (FR-ACC-05): a new email works once its link is opened. */
export interface AccountService {
  addEmail(email: string): Promise<void>;
  /** From the emailed link (`/#/confirm-email?userId=…&token=…`). Errors: `Auth.InvalidEmailConfirmationToken`. */
  confirmEmail(userId: string, token: string): Promise<void>;
}

/** A sample account offered on the sign-in screen. Only the mock backend provides these. */
export interface DemoAccount {
  userId: string;
  fullName: string;
  roleLabel: Role | 'Applicant';
  identifier: string;
}

export interface DemoAccounts {
  accounts: DemoAccount[];
  /** The password every demo account uses. */
  password: string;
  /** The code every demo SMS or authenticator "sends". */
  code: string;
  /** A pending staff invitation to try, as an app path (`/invitation/…`). */
  invitationPath: string | null;
  /** A sample SMS reminder link, as an app path (`/r/…`). */
  reminderPath: string | null;
}

/** Demo-only helpers: there is no real SMS or email, so the demo shows what would have arrived. */
export interface DemoAccountsService {
  list(): Promise<DemoAccounts>;
  /** Signs in as the account directly, skipping the password and two-step code. */
  signInAs(userId: string): Promise<CurrentUser>;
  /** The app path of the link in the latest email sent to `email` (reset or confirmation), if any. */
  latestEmailLink(email: string): Promise<string | null>;
}
