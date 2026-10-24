import type { OtpPurpose, OtpTicket } from '@/features/auth/api/auth.service';
import { ServiceError } from '@/shared/api/service-error';
import { DEMO_CODE } from './seed/users';

// The code rules of FR-ACC-02 and 08 §2. Every demo code is DEMO_CODE.
const EXPIRES_MS = 5 * 60_000;
const RESEND_MS = 60_000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60_000;

interface PendingCode {
  sentAt: number;
  attempts: number;
  blockedUntil?: number;
}

/** SMS codes per phone and purpose, as the backend keeps them (hashed there, in memory here). */
export function createOtpStore(now: () => Date) {
  const codes = new Map<string, PendingCode>();
  const keyOf = (phone: string, purpose: OtpPurpose) => `${purpose}:${phone}`;
  const iso = (ms: number) => new Date(ms).toISOString();

  const assertNotBlocked = (pending: PendingCode | undefined, at: number) => {
    if (pending?.blockedUntil && at < pending.blockedUntil) {
      throw new ServiceError('Otp.TooManyAttempts', { retryAt: iso(pending.blockedUntil) });
    }
  };

  return {
    /** "Sends" a new code. */
    send(phone: string, purpose: OtpPurpose): OtpTicket {
      const at = now().getTime();
      const pending = codes.get(keyOf(phone, purpose));
      assertNotBlocked(pending, at);
      if (pending && at < pending.sentAt + RESEND_MS) {
        throw new ServiceError('Otp.ResendTooSoon', { retryAt: iso(pending.sentAt + RESEND_MS) });
      }
      codes.set(keyOf(phone, purpose), { sentAt: at, attempts: 0 });
      return { phone, expiresAt: iso(at + EXPIRES_MS), resendAt: iso(at + RESEND_MS) };
    },

    /** Checks a code; `consume` uses it up on success. Wrong, expired and unknown codes look the same. */
    verify(phone: string, purpose: OtpPurpose, code: string, { consume }: { consume: boolean }) {
      const at = now().getTime();
      const key = keyOf(phone, purpose);
      const pending = codes.get(key);
      assertNotBlocked(pending, at);

      if (!pending || at > pending.sentAt + EXPIRES_MS) {
        throw new ServiceError('Otp.InvalidCode', { attemptsLeft: 0 });
      }
      if (code !== DEMO_CODE) {
        pending.attempts += 1;
        if (pending.attempts >= MAX_ATTEMPTS) {
          pending.blockedUntil = at + BLOCK_MS;
          throw new ServiceError('Otp.TooManyAttempts', { retryAt: iso(pending.blockedUntil) });
        }
        throw new ServiceError('Otp.InvalidCode', { attemptsLeft: MAX_ATTEMPTS - pending.attempts });
      }
      if (consume) codes.delete(key);
    },
  };
}

export type OtpStore = ReturnType<typeof createOtpStore>;
