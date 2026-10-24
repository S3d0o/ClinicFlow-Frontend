import { delay } from '@/mocks/db';
import { account } from '@/mocks/seed/users';
import { ServiceError } from '@/shared/api/service-error';
import { toE164EgyptianMobile } from '@/shared/lib/phone';
import type { AccountService, OtpService, OtpTicket, PasswordResetService, RegistrationService } from './auth.service';
import {
  consumeEmailToken,
  findByEmail,
  findByPhone,
  sendEmailLink,
  sessionUser,
  toCurrentUser,
  type AuthMockDeps,
} from './mock-accounts';

/** The answer given when no code is actually sent, identical to a real one (no enumeration, 08 §2). */
const silentTicket = (phone: string, now: Date): OtpTicket => ({
  phone,
  expiresAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
  resendAt: new Date(now.getTime() + 60_000).toISOString(),
});

const requirePhone = (phone: string) => {
  const e164 = toE164EgyptianMobile(phone);
  if (!e164) throw new ServiceError('Validation.InvalidPhone');
  return e164;
};

export function createMockOtpService({ db, otp, latencyMs, now }: AuthMockDeps): OtpService {
  return {
    async send(phone, purpose) {
      await delay(latencyMs);
      const e164 = requirePhone(phone);
      const user = findByPhone(db, e164);
      // Sign-up codes go to accounts waiting for verification; reset codes to verified ones
      const eligible = purpose === 'SignUp' ? user && !user.phoneVerified : user?.phoneVerified;
      return eligible ? otp.send(e164, purpose) : silentTicket(e164, now());
    },
  };
}

export function createMockRegistrationService(deps: AuthMockDeps): RegistrationService {
  const { db, otp, session, latencyMs, now } = deps;
  return {
    async register({ firstName, lastName, phone, email, password, preferredLanguage }) {
      await delay(latencyMs);
      const e164 = requirePhone(phone);
      const existing = findByPhone(db, e164);
      // A number that already has an account gets the same answer and no code (FR-ACC-01, 08 §2)
      if (existing?.phoneVerified) return silentTicket(e164, now());
      if (existing) db.users.splice(db.users.indexOf(existing), 1); // an unfinished sign-up starts over

      const user = account({
        id: `u-${crypto.randomUUID()}`,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        phone: e164,
        email: email?.trim() || undefined,
        preferredLanguage,
        password,
        roles: [{ role: 'Patient', scope: 'Organization' }],
        phoneVerified: false,
        emailConfirmed: false,
      });
      db.users.push(user);
      if (user.email) {
        sendEmailLink(deps, user, user.email, 'ConfirmEmail', (token) => `/confirm-email?userId=${user.id}&token=${token}`);
      }
      // Registering again within a minute keeps the code already sent
      try {
        return otp.send(e164, 'SignUp');
      } catch {
        return silentTicket(e164, now());
      }
    },

    async verifyPhone(phone, code) {
      await delay(latencyMs);
      const e164 = requirePhone(phone);
      otp.verify(e164, 'SignUp', code, { consume: true });
      const user = findByPhone(db, e164);
      if (!user) throw new ServiceError('Otp.InvalidCode', { attemptsLeft: 0 });
      user.phoneVerified = true;
      session.set(user.id);
      return toCurrentUser(db, user);
    },
  };
}

export function createMockPasswordResetService(deps: AuthMockDeps): PasswordResetService {
  const { db, otp, session, latencyMs } = deps;

  const setPassword = (user: NonNullable<ReturnType<typeof findByPhone>>, password: string) => {
    user.password = password;
    user.failedSignIns = 0;
    user.lockedUntil = undefined;
    // A reset revokes every session (FR-ACC-04); here, the one the demo keeps
    if (session.get() === user.id) session.clear();
  };

  return {
    async requestEmailLink(email) {
      await delay(latencyMs);
      const user = findByEmail(db, email);
      if (!user?.email || !user.emailConfirmed) return;
      sendEmailLink(deps, user, user.email, 'ResetPassword', (token) =>
        `/reset-password?email=${encodeURIComponent(user.email!)}&token=${token}`
      );
    },

    async checkCode(phone, code) {
      await delay(latencyMs);
      otp.verify(requirePhone(phone), 'PasswordReset', code, { consume: false });
    },

    async resetWithCode(phone, code, newPassword) {
      await delay(latencyMs);
      const e164 = requirePhone(phone);
      otp.verify(e164, 'PasswordReset', code, { consume: true });
      const user = findByPhone(db, e164);
      if (!user) throw new ServiceError('Otp.InvalidCode', { attemptsLeft: 0 });
      setPassword(user, newPassword);
    },

    async resetWithEmailToken(email, token, newPassword) {
      await delay(latencyMs);
      const user = consumeEmailToken(deps, token, 'ResetPassword');
      if (!user || user.email?.toLowerCase() !== email.trim().toLowerCase()) {
        throw new ServiceError('Auth.InvalidPasswordResetToken');
      }
      setPassword(user, newPassword);
    },
  };
}

export function createMockAccountService(deps: AuthMockDeps): AccountService {
  const { latencyMs } = deps;
  return {
    async addEmail(email) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      user.email = email.trim();
      user.emailConfirmed = false;
      sendEmailLink(deps, user, user.email, 'ConfirmEmail', (token) => `/confirm-email?userId=${user.id}&token=${token}`);
    },

    async confirmEmail(userId, token) {
      await delay(latencyMs);
      const user = consumeEmailToken(deps, token, 'ConfirmEmail');
      if (!user || user.id !== userId) throw new ServiceError('Auth.InvalidEmailConfirmationToken');
      user.emailConfirmed = true;
    },
  };
}
