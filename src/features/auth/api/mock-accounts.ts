import type { EmailToken, MockDb, MockDeps } from '@/mocks/db';
import type { OtpStore } from '@/mocks/otp-store';
import { grantsFor } from '@/mocks/seed/role-permissions';
import type { UserSeed } from '@/mocks/seed/users';
import type { MockSessionStore } from '@/mocks/session-store';
import { ServiceError } from '@/shared/api/service-error';
import { toE164EgyptianMobile } from '@/shared/lib/phone';
import type { CurrentUser } from '../model/user';

// Helpers shared by the mock auth adapters. They stand in for the backend's account store.

export interface AuthMockDeps extends MockDeps {
  session: MockSessionStore;
  otp: OtpStore;
}

/** The `/me` view of an account. */
export function toCurrentUser(db: MockDb, user: UserSeed): CurrentUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    roles: user.roles,
    permissions: grantsFor(user.roles),
    phoneVerified: user.phoneVerified,
    emailConfirmed: user.emailConfirmed,
    hasDoctorApplication: db.applications.some((a) => a.userId === user.id),
    mfaEnabled: user.roles.some((r) => r.role !== 'Patient'),
    mfaEnrolled: user.mfaEnrolled,
  };
}

export const findByPhone = (db: MockDb, phone: string) => {
  const e164 = toE164EgyptianMobile(phone);
  return e164 ? db.users.find((u) => u.phone === e164) : undefined;
};

export const findByEmail = (db: MockDb, email: string) => {
  const wanted = email.trim().toLowerCase();
  return db.users.find((u) => u.email?.toLowerCase() === wanted);
};

/** A phone number in any Egyptian format, or an email ignoring case (FR-ACC-03). */
export const findByIdentifier = (db: MockDb, identifier: string) =>
  toE164EgyptianMobile(identifier) ? findByPhone(db, identifier) : findByEmail(db, identifier);

/** The signed-in account, or 401 when there is none. */
export function sessionUser({ db, session }: Pick<AuthMockDeps, 'db' | 'session'>): UserSeed {
  const user = db.users.find((u) => u.id === session.get());
  if (!user) throw new ServiceError('Auth.Unauthorized');
  return user;
}

/** Creates a link token and records the email that carries it (shown by the demo panel). */
export function sendEmailLink(
  { db, now }: Pick<MockDeps, 'db' | 'now'>,
  user: UserSeed,
  to: string,
  purpose: EmailToken['purpose'],
  path: (token: string) => string
) {
  const token = crypto.randomUUID();
  const sentAt = now();
  db.emailTokens.push({ token, userId: user.id, purpose, expiresAt: new Date(sentAt.getTime() + 24 * 3_600_000).toISOString() });
  db.sentEmails.push({
    to,
    kind: purpose === 'ConfirmEmail' ? 'EmailConfirmation' : 'PasswordReset',
    path: path(token),
    sentAt: sentAt.toISOString(),
  });
}

/** Uses up a link token; `undefined` when it's unknown, used or expired. */
export function consumeEmailToken({ db, now }: Pick<MockDeps, 'db' | 'now'>, token: string, purpose: EmailToken['purpose']) {
  const index = db.emailTokens.findIndex((t) => t.token === token && t.purpose === purpose);
  if (index < 0) return undefined;
  const [entry] = db.emailTokens.splice(index, 1);
  if (Date.parse(entry.expiresAt) < now().getTime()) return undefined;
  return db.users.find((u) => u.id === entry.userId);
}
