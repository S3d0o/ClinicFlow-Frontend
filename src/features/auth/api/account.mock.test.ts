import { describe, expect, it } from 'vitest';
import { DEMO_CODE, DEMO_PASSWORD } from '@/mocks/seed/users';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const NEW_PATIENT = {
  firstName: 'Omar',
  lastName: 'Hassan',
  phone: '0122 333 4444',
  password: 'Strong#Pass1',
  preferredLanguage: 'ar' as const,
};

describe('patient sign-up (FR-ACC-01, FR-ACC-02)', () => {
  it('creates the account, then verifies the phone and signs in', async () => {
    const { services } = createTestBackend();
    const ticket = await services.registration.register(NEW_PATIENT);
    expect(ticket.phone).toBe('+201223334444');

    await expect(services.auth.signIn({ identifier: ticket.phone, password: NEW_PATIENT.password })).rejects.toSatisfy((e) =>
      isServiceError(e, 'Auth.PhoneNotVerified')
    );

    const user = await services.registration.verifyPhone(ticket.phone, DEMO_CODE);
    expect(user).toMatchObject({ fullName: 'Omar Hassan', phoneVerified: true, roles: [{ role: 'Patient' }] });
    expect((await services.auth.getCurrentUser())?.id).toBe(user.id);
  });

  it('answers the same for a number that already has an account, without sending a code', async () => {
    const { services, db } = createTestBackend();
    const ticket = await services.registration.register({ ...NEW_PATIENT, phone: '01012345678' });
    expect(ticket.phone).toBe('+201012345678');
    expect(db.users.filter((u) => u.phone === '+201012345678')).toHaveLength(1);
    await expect(services.registration.verifyPhone(ticket.phone, DEMO_CODE)).rejects.toSatisfy((e) =>
      isServiceError(e, 'Otp.InvalidCode')
    );
  });

  it('emails a confirmation link when an email is given', async () => {
    const { services } = createTestBackend();
    await services.registration.register({ ...NEW_PATIENT, email: 'omar@example.com' });
    expect(await services.demoAccounts!.latestEmailLink('OMAR@example.com')).toMatch(/^\/confirm-email\?userId=.+&token=.+/);
  });
});

describe('password reset (FR-ACC-04)', () => {
  it('resets by SMS code, checking the code before the new password is chosen', async () => {
    const { services } = createTestBackend();
    await services.otp.send('01012345678', 'PasswordReset');
    await services.passwordReset.checkCode('01012345678', DEMO_CODE);
    await services.passwordReset.resetWithCode('01012345678', DEMO_CODE, 'Fresh#Pass9');

    await expect(services.auth.signIn({ identifier: '01012345678', password: DEMO_PASSWORD })).rejects.toBeDefined();
    expect((await services.auth.signIn({ identifier: '01012345678', password: 'Fresh#Pass9' })).status).toBe('signed-in');
  });

  it('resets by email link, once', async () => {
    const { services } = createTestBackend();
    await services.passwordReset.requestEmailLink('karim.adel@clinicflow.eg');
    const link = await services.demoAccounts!.latestEmailLink('karim.adel@clinicflow.eg');
    const params = new URLSearchParams(link!.split('?')[1]);

    await services.passwordReset.resetWithEmailToken(params.get('email')!, params.get('token')!, 'Fresh#Pass9');
    await expect(
      services.passwordReset.resetWithEmailToken(params.get('email')!, params.get('token')!, 'Other#Pass9')
    ).rejects.toSatisfy((e) => isServiceError(e, 'Auth.InvalidPasswordResetToken'));
  });

  it('never reveals whether an account exists', async () => {
    const { services } = createTestBackend();
    await expect(services.passwordReset.requestEmailLink('nobody@example.com')).resolves.toBeUndefined();
    await expect(services.otp.send('01099999999', 'PasswordReset')).resolves.toMatchObject({ phone: '+201099999999' });
  });
});

describe('account email (FR-ACC-05)', () => {
  it('adds an email that works once its link is opened', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    await services.account.addEmail('mohamed@example.com');
    expect((await services.auth.getCurrentUser())?.emailConfirmed).toBe(false);

    const link = await services.demoAccounts!.latestEmailLink('mohamed@example.com');
    const params = new URLSearchParams(link!.split('?')[1]);
    await services.account.confirmEmail(params.get('userId')!, params.get('token')!);
    expect(await services.auth.getCurrentUser()).toMatchObject({ email: 'mohamed@example.com', emailConfirmed: true });
  });
});
