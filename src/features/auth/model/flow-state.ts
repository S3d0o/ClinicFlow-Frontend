import type { MfaChallenge, OtpTicket } from '../api/auth.service';
import type { SignUpValues } from './schemas';

/** What the sign-up form keeps when the user goes back to fix their number (never the password). */
export type SignUpDraft = Omit<SignUpValues, 'password' | 'acceptTerms'>;

// What one account screen hands the next through router state. A screen opened without it (a
// reload, a shared link) sends the user back to the start of its flow.

/** Sign-up → verify phone. `from` is where to go once signed in. */
export interface VerifyPhoneState {
  ticket: OtpTicket;
  from?: string;
  draft?: SignUpDraft;
}

/** Sign-in → two-step code. */
export interface MfaState {
  challenge: MfaChallenge;
  from?: string;
}

/** Forgot password (phone) → code. */
export interface ResetCodeState {
  ticket: OtpTicket;
}

/** Code → new password. */
export interface ResetWithCodeState {
  phone: string;
  code: string;
}

/** Where every "too many attempts" ends up (FR-ACC-02, V1 lockout). */
export const lockedPath = (retryAt: string | undefined) => (retryAt ? `/locked?until=${encodeURIComponent(retryAt)}` : '/locked');

/** Reads the router state, or `null` when the screen was opened without it. */
export const readState = <T>(state: unknown, key: keyof T): T | null =>
  state && typeof state === 'object' && key in state ? (state as T) : null;
