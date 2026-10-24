import { delay, type MockDb } from '@/mocks/db';
import { grantsFor } from '@/mocks/seed/role-permissions';
import { DEMO_CODE, DEMO_PASSWORD, type UserSeed } from '@/mocks/seed/users';
import type { MockSessionStore } from '@/mocks/session-store';
import { ServiceError } from '@/shared/api/service-error';
import { toE164EgyptianMobile } from '@/shared/lib/phone';
import type { CurrentUser } from '../model/user';
import type { AuthService, DemoAccountsService } from './auth.service';

interface Options {
  db: MockDb;
  session: MockSessionStore;
  latencyMs: number;
}

const toCurrentUser = (seed: UserSeed): CurrentUser => {
  const isStaff = seed.roles.some((r) => r.role !== 'Patient');
  return {
    id: seed.id,
    fullName: seed.fullName,
    phone: seed.phone,
    email: seed.email,
    preferredLanguage: seed.preferredLanguage,
    roles: seed.roles,
    permissions: grantsFor(seed.roles),
    hasDoctorApplication: seed.hasDoctorApplication,
    mfaEnabled: isStaff,
  };
};

/** Matches a phone number in any Egyptian format, or an email ignoring case (FR-ACC-03). */
function findByIdentifier(db: MockDb, identifier: string): UserSeed | undefined {
  const phone = toE164EgyptianMobile(identifier);
  const email = identifier.trim().toLowerCase();
  return db.users.find((u) => (phone ? u.phone === phone : u.email?.toLowerCase() === email));
}

export function createMockAuthService({ db, session, latencyMs }: Options): AuthService {
  // Pending two-step challenges: challenge id → user id
  const challenges = new Map<string, string>();

  const userById = (id: string | null) => (id ? db.users.find((u) => u.id === id) : undefined);

  return {
    async getCurrentUser() {
      await delay(latencyMs);
      const user = userById(session.get());
      return user ? toCurrentUser(user) : null;
    },

    async signIn({ identifier, password }) {
      await delay(latencyMs);
      const user = findByIdentifier(db, identifier);
      // The same error whether the account exists or not, so sign-in reveals nothing (FR-ACC-03)
      if (!user || password !== DEMO_PASSWORD) throw new ServiceError('Auth.InvalidCredentials');

      const current = toCurrentUser(user);
      if (current.mfaEnabled) {
        const challengeId = crypto.randomUUID();
        challenges.set(challengeId, user.id);
        return { status: 'mfa-required', challengeId };
      }
      session.set(user.id);
      return { status: 'signed-in', user: current };
    },

    async verifyMfa(challengeId, code) {
      await delay(latencyMs);
      const user = userById(challenges.get(challengeId) ?? null);
      if (!user) throw new ServiceError('Auth.MfaChallengeExpired');
      if (code !== DEMO_CODE) throw new ServiceError('Auth.InvalidMfaCode');
      challenges.delete(challengeId);
      session.set(user.id);
      return toCurrentUser(user);
    },

    async signOut() {
      await delay(latencyMs);
      session.clear();
    },
  };
}

export function createMockDemoAccountsService({ db, session, latencyMs }: Options): DemoAccountsService {
  return {
    async list() {
      await delay(latencyMs);
      return {
        password: DEMO_PASSWORD,
        code: DEMO_CODE,
        accounts: db.users.map((u) => ({
          userId: u.id,
          fullName: u.fullName,
          roleLabel: u.demoLabel,
          identifier: u.email ?? u.phone,
        })),
      };
    },

    async signInAs(userId) {
      await delay(latencyMs);
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new ServiceError('Auth.UserNotFound');
      session.set(user.id);
      return toCurrentUser(user);
    },
  };
}
