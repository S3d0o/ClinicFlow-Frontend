import { describe, expect, it } from 'vitest';
import { DEMO_INVITATION_TOKEN } from '@/mocks/seed/invitations';
import { DEMO_CODE } from '@/mocks/seed/users';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const ACCEPT = { fullName: 'Fatma Hassan', phone: '01011112222', password: 'Nurse#2026' };

describe('staff invitations (FR-STF-01, FR-STF-02)', () => {
  it('shows the invitation, then activates the staff member and signs them in', async () => {
    const { services } = createTestBackend();
    const invitation = await services.invitations.get(DEMO_INVITATION_TOKEN);
    expect(invitation).toMatchObject({ email: 'f.hassan@clinicflow.eg', invitedByName: 'Dr. Hala Mostafa' });

    const user = await services.invitations.accept(DEMO_INVITATION_TOKEN, ACCEPT);
    expect(user).toMatchObject({ email: 'f.hassan@clinicflow.eg', emailConfirmed: true, mfaEnabled: true, mfaEnrolled: false });
    expect(user.roles).toEqual([{ role: 'Nurse', scope: 'Branch', branchIds: ['br-nc'] }]);
  });

  it('works once', async () => {
    const { services } = createTestBackend();
    await services.invitations.accept(DEMO_INVITATION_TOKEN, ACCEPT);
    await expect(services.invitations.get(DEMO_INVITATION_TOKEN)).rejects.toSatisfy((e) => isServiceError(e, 'Invitation.NotFound'));
  });

  it('expires', async () => {
    const { services, advance } = createTestBackend();
    advance(49 * 3_600_000);
    await expect(services.invitations.get(DEMO_INVITATION_TOKEN)).rejects.toSatisfy((e) => isServiceError(e, 'Invitation.Expired'));
  });
});

describe('two-step setup (FR-STF-07)', () => {
  it('enrols an authenticator with recovery codes, then requires it at sign-in', async () => {
    const { services } = createTestBackend();
    await services.invitations.accept(DEMO_INVITATION_TOKEN, ACCEPT);

    const enrollment = await services.mfa.startEnrollment();
    expect(enrollment.secret).toMatch(/^[A-Z2-7]{16}$/);
    expect(enrollment.otpauthUri).toContain(`secret=${enrollment.secret}`);
    expect(enrollment.recoveryCodes).toHaveLength(8);

    await expect(services.mfa.confirmEnrollment('000000')).rejects.toSatisfy((e) => isServiceError(e, 'Auth.InvalidMfaCode'));
    expect((await services.mfa.confirmEnrollment(DEMO_CODE)).mfaEnrolled).toBe(true);

    await services.auth.signOut();
    const result = await services.auth.signIn({ identifier: 'f.hassan@clinicflow.eg', password: ACCEPT.password });
    expect(result.status).toBe('mfa-required');
  });
});
