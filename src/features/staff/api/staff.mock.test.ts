import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '@/mocks/seed/users';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const rejectsWith = (promise: Promise<unknown>, code: string) =>
  expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

const PAGE = { page: 1, pageSize: 50 };

describe('mock staff service', () => {
  it('lists every staff member and the open invitation for an admin, without patients', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const { items, total } = await services.staff.list({}, PAGE);
    expect(total).toBe(items.length);
    expect(items.map((m) => m.fullName)).toEqual(expect.arrayContaining(['Mona Samir', 'Fatma Hassan Mahmoud']));
    expect(items.find((m) => m.fullName === 'Fatma Hassan Mahmoud')?.status).toBe('Invited');
    expect(items.some((m) => m.fullName === 'Mohamed Adel')).toBe(false);
  });

  it('filters by text, role, branch and status, and pages', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    expect((await services.staff.list({ text: 'mona.samir' }, PAGE)).items.map((m) => m.id)).toEqual(['u-mona']);
    expect((await services.staff.list({ role: 'Nurse' }, PAGE)).items.every((m) => m.roles.some((r) => r.role === 'Nurse'))).toBe(true);
    expect((await services.staff.list({ status: 'Invited' }, PAGE)).total).toBe(1);
    const page = await services.staff.list({}, { page: 2, pageSize: 5 });
    expect(page.items).toHaveLength(5);
  });

  it("shows a branch manager only the staff of their branches", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-omar' });
    const { items } = await services.staff.list({}, PAGE);
    expect(items.some((m) => m.id === 'u-mona')).toBe(false); // Nasr City only
    expect(items.some((m) => m.id === 'u-ahmed')).toBe(true); // Nasr City and Maadi
    await rejectsWith(services.staff.get('u-mona'), 'Staff.NotFound');
  });

  it('invites with roles the caller may give, once per email', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const member = await services.staff.invite({ fullName: 'Nada Ali', email: 'nada.ali@clinicflow.eg', roles: [{ role: 'Receptionist', scope: 'Branch', branchIds: ['br-ma'] }] });
    expect(member).toMatchObject({ status: 'Invited', fullName: 'Nada Ali' });
    await rejectsWith(services.staff.invite({ fullName: 'Nada', email: 'NADA.ALI@clinicflow.eg', roles: [{ role: 'Nurse', scope: 'Organization' }] }), 'Auth.EmailAlreadyExists');
    await rejectsWith(services.staff.invite({ fullName: 'X', email: 'x@clinicflow.eg', roles: [] }), 'Staff.RoleNotGrantable');
  });

  it("keeps a branch manager from giving the Manager role or roles at other branches", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-omar' });
    await rejectsWith(services.staff.invite({ fullName: 'X', email: 'x@clinicflow.eg', roles: [{ role: 'Manager', scope: 'Branch', branchIds: ['br-ma'] }] }), 'Staff.RoleNotGrantable');
    await rejectsWith(services.staff.invite({ fullName: 'X', email: 'x@clinicflow.eg', roles: [{ role: 'Nurse', scope: 'Branch', branchIds: ['br-nc'] }] }), 'Access.OutOfScope');
  });

  it('resends and cancels an invitation', async () => {
    const { services, db } = createTestBackend({ signedInAs: 'u-karim' });
    const oldToken = db.invitations[0].token;
    await services.staff.resendInvitation('inv-fatma');
    expect(db.invitations[0].token).not.toBe(oldToken);
    await services.staff.revokeInvitation('inv-fatma');
    expect((await services.staff.list({ status: 'Invited' }, PAGE)).total).toBe(0);
  });

  it('changes roles, but never your own', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const member = await services.staff.setRoles('u-sara', [{ role: 'Nurse', scope: 'Branch', branchIds: ['br-nc', 'br-ma'] }]);
    expect(member.roles[0].branchIds).toEqual(['br-nc', 'br-ma']);
    await rejectsWith(services.staff.setRoles('u-karim', [{ role: 'Admin', scope: 'Organization' }]), 'Staff.CannotChangeOwnAccess');
  });

  it('deactivates now, which stops sign-in, or at the end of a later day', async () => {
    const { services, advance } = createTestBackend({ signedInAs: 'u-karim' });
    const leaving = await services.staff.deactivate('u-mona', '2026-10-30');
    expect(leaving.status).toBe('Leaving');

    const gone = await services.staff.deactivate('u-sara');
    expect(gone.status).toBe('Deactivated');
    await rejectsWith(services.auth.signIn({ identifier: 'sara.ibrahim@clinicflow.eg', password: DEMO_PASSWORD }), 'Auth.AccountNotActive');
    await rejectsWith(services.staff.deactivate('u-sara'), 'Staff.AlreadyDeactivated');
    await rejectsWith(services.staff.deactivate('u-ahmed', '2026-10-01'), 'Staff.EndDateInPast');

    advance(7 * 24 * 3_600_000);
    expect((await services.staff.get('u-mona')).status).toBe('Deactivated');
  });

  it("counts a doctor's booked visits still to come", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    expect((await services.staff.get('u-ahmed')).upcomingAppointments).toBeGreaterThan(0);
  });

  it('resets two-step sign-in', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    expect((await services.staff.resetMfa('u-mona')).mfaEnrolled).toBe(false);
  });
});

describe('mock roles service', () => {
  it('gives an admin the matrix of the six staff roles', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const matrix = await services.roles.getMatrix();
    expect(matrix.map((r) => r.role)).toEqual(['Admin', 'Manager', 'Receptionist', 'Nurse', 'Doctor', 'Accountant']);
    expect(matrix.find((r) => r.role === 'Nurse')?.grants['vitals.write']).toBe('A');

    const desk = createTestBackend({ signedInAs: 'u-mona' });
    await rejectsWith(desk.services.roles.getMatrix(), 'Access.OutOfScope');
  });
});
