import { delay } from '@/mocks/db';
import { DEMO_CODE, DEMO_PASSWORD } from '@/mocks/seed/users';
import { ServiceError } from '@/shared/api/service-error';
import type { Role } from '../model/user';
import type { AuthService, DemoAccountsService } from './auth.service';
import { findByIdentifier, toCurrentUser, type AuthMockDeps } from './mock-accounts';

// V1's lockout (API contract §2): 5 failed sign-ins lock the account for 15 minutes.
const MAX_FAILED_SIGN_INS = 5;
const LOCKOUT_MS = 15 * 60_000;

export function createMockAuthService(deps: AuthMockDeps): AuthService {
  const { db, session, latencyMs, now } = deps;
  // Pending two-step challenges: challenge id → user id
  const challenges = new Map<string, string>();

  const userById = (id: string | null | undefined) => (id ? db.users.find((u) => u.id === id) : undefined);

  return {
    async getCurrentUser() {
      await delay(latencyMs);
      const user = userById(session.get());
      return user ? toCurrentUser(db, user) : null;
    },

    async signIn({ identifier, password }) {
      await delay(latencyMs);
      const user = findByIdentifier(db, identifier);
      // The same error whether the account exists or not, so sign-in reveals nothing (FR-ACC-03)
      if (!user) throw new ServiceError('Auth.InvalidCredentials');

      const at = now().getTime();
      if (user.lockedUntil && at < Date.parse(user.lockedUntil)) {
        throw new ServiceError('Auth.AccountLockedOut', { retryAt: user.lockedUntil });
      }
      if (password !== user.password) {
        user.failedSignIns += 1;
        if (user.failedSignIns >= MAX_FAILED_SIGN_INS) {
          user.failedSignIns = 0;
          user.lockedUntil = new Date(at + LOCKOUT_MS).toISOString();
          throw new ServiceError('Auth.AccountLockedOut', { retryAt: user.lockedUntil });
        }
        throw new ServiceError('Auth.InvalidCredentials');
      }
      user.failedSignIns = 0;
      user.lockedUntil = undefined;
      const current = toCurrentUser(db, user);
      // A self-registered account is usable only after its phone is verified (FR-ACC-02); staff
      // accounts are activated by their invitation instead
      if (!user.phoneVerified && !current.mfaEnabled) throw new ServiceError('Auth.PhoneNotVerified');

      if (current.mfaEnabled && current.mfaEnrolled) {
        const id = crypto.randomUUID();
        challenges.set(id, user.id);
        const roleLabel = user.roles.find((r) => r.role !== 'Patient')!.role as Role;
        return { status: 'mfa-required', challenge: { id, identifier: identifier.trim(), roleLabel } };
      }
      // Staff who haven't set up an authenticator get a session that only opens the setup screen
      session.set(user.id);
      return { status: 'signed-in', user: current };
    },

    async verifyMfa(challengeId, proof) {
      await delay(latencyMs);
      const user = userById(challenges.get(challengeId));
      if (!user) throw new ServiceError('Auth.MfaChallengeExpired');

      if ('code' in proof) {
        if (proof.code !== DEMO_CODE) throw new ServiceError('Auth.InvalidMfaCode');
      } else {
        const index = user.recoveryCodes.indexOf(proof.recoveryCode.trim());
        if (index < 0) throw new ServiceError('Auth.InvalidMfaCode');
        user.recoveryCodes.splice(index, 1); // each recovery code works once
      }
      challenges.delete(challengeId);
      session.set(user.id);
      return toCurrentUser(db, user);
    },

    async signOut() {
      await delay(latencyMs);
      session.clear();
    },
  };
}

export function createMockDemoAccountsService({ db, session, latencyMs, now }: AuthMockDeps): DemoAccountsService {
  return {
    async list() {
      await delay(latencyMs);
      const invitation = db.invitations.find(
        (i) => !i.acceptedAt && !i.revokedAt && Date.parse(i.expiresAt) > now().getTime()
      );
      return {
        password: DEMO_PASSWORD,
        code: DEMO_CODE,
        invitationPath: invitation ? `/invitation/${invitation.token}` : null,
        accounts: db.users
          .filter((u) => u.demoLabel)
          .map((u) => ({ userId: u.id, fullName: u.fullName, roleLabel: u.demoLabel!, identifier: u.email ?? u.phone })),
      };
    },

    async signInAs(userId) {
      await delay(latencyMs);
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new ServiceError('Auth.UserNotFound');
      session.set(user.id);
      return toCurrentUser(db, user);
    },

    async latestEmailLink(email) {
      await delay(latencyMs);
      const wanted = email.trim().toLowerCase();
      return db.sentEmails.filter((e) => e.to.toLowerCase() === wanted && e.path).at(-1)?.path ?? null;
    },
  };
}
