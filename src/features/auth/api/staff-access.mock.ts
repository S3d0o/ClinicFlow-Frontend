import { delay } from '@/mocks/db';
import { account, DEMO_CODE } from '@/mocks/seed/users';
import { ServiceError } from '@/shared/api/service-error';
import { toE164EgyptianMobile } from '@/shared/lib/phone';
import type { InvitationService, MfaService } from './auth.service';
import { sessionUser, toCurrentUser, type AuthMockDeps } from './mock-accounts';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const randomBase32 = (length: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length)), (byte) => BASE32[byte % 32]).join('');

const randomRecoveryCode = () => {
  const [a, b] = crypto.getRandomValues(new Uint16Array(2));
  return `${String(a % 10_000).padStart(4, '0')}-${String(b % 10_000).padStart(4, '0')}`;
};

export function createMockMfaService(deps: AuthMockDeps): MfaService {
  const { db, latencyMs } = deps;
  return {
    async startEnrollment() {
      await delay(latencyMs);
      const user = sessionUser(deps);
      user.pendingMfaSecret = randomBase32(16);
      user.pendingRecoveryCodes = Array.from({ length: 8 }, randomRecoveryCode);
      const label = encodeURIComponent(`ClinicFlow:${user.email ?? user.phone}`);
      return {
        secret: user.pendingMfaSecret,
        otpauthUri: `otpauth://totp/${label}?secret=${user.pendingMfaSecret}&issuer=ClinicFlow&period=30&digits=6`,
        recoveryCodes: [...user.pendingRecoveryCodes],
      };
    },

    async confirmEnrollment(code) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      if (!user.pendingMfaSecret || code !== DEMO_CODE) throw new ServiceError('Auth.InvalidMfaCode');
      user.mfaEnrolled = true;
      user.recoveryCodes = user.pendingRecoveryCodes ?? [];
      user.pendingMfaSecret = undefined;
      user.pendingRecoveryCodes = undefined;
      return toCurrentUser(db, user);
    },
  };
}

export function createMockInvitationService(deps: AuthMockDeps): InvitationService {
  const { db, session, latencyMs, now } = deps;

  /** The invitation behind a link, if it can still be used (single use, 72 hours: FR-STF-01). */
  const usable = (token: string) => {
    const invitation = db.invitations.find((i) => i.token === token);
    if (!invitation || invitation.acceptedAt || invitation.revokedAt) throw new ServiceError('Invitation.NotFound');
    if (Date.parse(invitation.expiresAt) < now().getTime()) throw new ServiceError('Invitation.Expired');
    return invitation;
  };

  return {
    async get(token) {
      await delay(latencyMs);
      const invitation = usable(token);
      const inviter = db.users.find((u) => u.id === invitation.invitedByUserId);
      return {
        email: invitation.email,
        fullName: invitation.fullName,
        roles: invitation.roles,
        invitedByName: inviter?.fullName ?? '',
        expiresAt: invitation.expiresAt,
      };
    },

    async accept(token, { fullName, phone, password }) {
      await delay(latencyMs);
      const invitation = usable(token);
      const e164 = toE164EgyptianMobile(phone);
      if (!e164) throw new ServiceError('Validation.InvalidPhone');

      const user = account({
        id: `u-${crypto.randomUUID()}`,
        fullName: fullName.trim(),
        phone: e164,
        email: invitation.email,
        roles: invitation.roles,
        password,
        // The invitation link proves the email; the phone hasn't been checked by a code
        phoneVerified: false,
        emailConfirmed: true,
        mfaEnrolled: false,
        recoveryCodes: [],
      });
      db.users.push(user);
      invitation.acceptedAt = now().toISOString();
      session.set(user.id);
      return toCurrentUser(db, user);
    },
  };
}
