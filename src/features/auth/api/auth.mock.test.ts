import { describe, expect, it } from 'vitest';
import { createMockDb } from '@/mocks/db';
import { DEMO_CODE, DEMO_PASSWORD } from '@/mocks/seed/users';
import { memorySessionStore } from '@/mocks/session-store';
import { isServiceError } from '@/shared/api/service-error';
import { createMockAuthService } from './auth.mock';

const setup = () => {
  const session = memorySessionStore();
  return { session, auth: createMockAuthService({ db: createMockDb(), session, latencyMs: 0 }) };
};

describe('mock auth service', () => {
  it('signs a patient in directly, by phone in local format', async () => {
    const { auth, session } = setup();
    const result = await auth.signIn({ identifier: '010 1234 5678', password: DEMO_PASSWORD });
    expect(result.status).toBe('signed-in');
    expect(session.get()).toBe('u-mohamed');
    expect((await auth.getCurrentUser())?.fullName).toBe('Mohamed Adel');
  });

  it('asks staff for the two-step code, then signs them in', async () => {
    const { auth } = setup();
    const result = await auth.signIn({ identifier: 'MONA.SAMIR@clinicflow.eg', password: DEMO_PASSWORD });
    if (result.status !== 'mfa-required') throw new Error('expected a two-step challenge');
    expect(await auth.getCurrentUser()).toBeNull();

    await expect(auth.verifyMfa(result.challengeId, '000000')).rejects.toSatisfy((e) =>
      isServiceError(e, 'Auth.InvalidMfaCode')
    );
    const user = await auth.verifyMfa(result.challengeId, DEMO_CODE);
    expect(user.roles.map((r) => r.role)).toEqual(['Receptionist']);
    expect(await auth.getCurrentUser()).not.toBeNull();
  });

  it('gives the same error for an unknown account and a wrong password', async () => {
    const { auth } = setup();
    for (const request of [
      { identifier: 'nobody@example.com', password: DEMO_PASSWORD },
      { identifier: 'karim.adel@clinicflow.eg', password: 'wrong' },
    ]) {
      await expect(auth.signIn(request)).rejects.toSatisfy((e) => isServiceError(e, 'Auth.InvalidCredentials'));
    }
  });

  it('signs out', async () => {
    const { auth } = setup();
    await auth.signIn({ identifier: '01012345678', password: DEMO_PASSWORD });
    await auth.signOut();
    expect(await auth.getCurrentUser()).toBeNull();
  });
});
