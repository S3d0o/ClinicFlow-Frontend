import { describe, expect, it } from 'vitest';
import { DEMO_CODE, DEMO_PASSWORD } from '@/mocks/seed/users';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const rejectsWith = (promise: Promise<unknown>, code: string) =>
  expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

describe('mock auth service', () => {
  it('signs a patient in directly, by phone in local format', async () => {
    const { services, session } = createTestBackend();
    const result = await services.auth.signIn({ identifier: '010 1234 5678', password: DEMO_PASSWORD });
    expect(result.status).toBe('signed-in');
    expect(session.get()).toBe('u-mohamed');
    expect((await services.auth.getCurrentUser())?.fullName).toBe('Mohamed Adel');
  });

  it('asks staff for the two-step code, then signs them in', async () => {
    const { services } = createTestBackend();
    const result = await services.auth.signIn({ identifier: 'MONA.SAMIR@clinicflow.eg', password: DEMO_PASSWORD });
    if (result.status !== 'mfa-required') throw new Error('expected a two-step challenge');
    expect(result.challenge).toMatchObject({ identifier: 'MONA.SAMIR@clinicflow.eg', roleLabel: 'Receptionist' });
    expect(await services.auth.getCurrentUser()).toBeNull();

    await rejectsWith(services.auth.verifyMfa(result.challenge.id, { code: '000000' }), 'Auth.InvalidMfaCode');
    const user = await services.auth.verifyMfa(result.challenge.id, { code: DEMO_CODE });
    expect(user.roles.map((r) => r.role)).toEqual(['Receptionist']);
    expect(await services.auth.getCurrentUser()).not.toBeNull();
  });

  it('accepts each recovery code once instead of the authenticator code', async () => {
    const { services, db } = createTestBackend();
    const recoveryCode = db.users.find((u) => u.id === 'u-sara')!.recoveryCodes[0];
    const signIn = async () => {
      const result = await services.auth.signIn({ identifier: 'sara.ibrahim@clinicflow.eg', password: DEMO_PASSWORD });
      if (result.status !== 'mfa-required') throw new Error('expected a two-step challenge');
      return result.challenge.id;
    };
    await services.auth.verifyMfa(await signIn(), { recoveryCode });
    await rejectsWith(services.auth.verifyMfa(await signIn(), { recoveryCode }), 'Auth.InvalidMfaCode');
  });

  it('gives the same error for an unknown account and a wrong password', async () => {
    const { services } = createTestBackend();
    await rejectsWith(services.auth.signIn({ identifier: 'nobody@example.com', password: DEMO_PASSWORD }), 'Auth.InvalidCredentials');
    await rejectsWith(services.auth.signIn({ identifier: 'karim.adel@clinicflow.eg', password: 'wrong' }), 'Auth.InvalidCredentials');
  });

  it('locks the account for 15 minutes after 5 failed sign-ins', async () => {
    const { services, advance } = createTestBackend();
    const attempt = (password: string) => services.auth.signIn({ identifier: '01012345678', password });
    for (let i = 0; i < 4; i++) await rejectsWith(attempt('wrong'), 'Auth.InvalidCredentials');
    await expect(attempt('wrong')).rejects.toSatisfy(
      (e) => isServiceError(e, 'Auth.AccountLockedOut') && e.details.retryAt === '2026-10-24T05:15:00.000Z'
    );
    await rejectsWith(attempt(DEMO_PASSWORD), 'Auth.AccountLockedOut');
    advance(15 * 60_000);
    expect((await attempt(DEMO_PASSWORD)).status).toBe('signed-in');
  });

  it('signs out', async () => {
    const { services } = createTestBackend();
    await services.auth.signIn({ identifier: '01012345678', password: DEMO_PASSWORD });
    await services.auth.signOut();
    expect(await services.auth.getCurrentUser()).toBeNull();
  });
});
