import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const rejectsWith = (promise: Promise<unknown>, code: string) =>
  expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

const BRANCH = {
  code: 'HL',
  nameEn: 'Heliopolis',
  nameAr: 'مصر الجديدة',
  addressEn: '5 Baghdad St., Heliopolis',
  addressAr: '5 شارع بغداد، مصر الجديدة',
  phone: '+20224150000',
  timeZone: 'Africa/Cairo',
};

describe('mock branch admin service', () => {
  it('adds a branch with a unique code and the usual week, and lists it publicly', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const branch = await services.branchAdmin.create(BRANCH);
    expect((await services.branchAdmin.getHours(branch.id)).length).toBe(7);
    expect((await services.org.listBranches()).map((b) => b.code)).toContain('HL');
    await rejectsWith(services.branchAdmin.create(BRANCH), 'Branch.CodeTaken');
  });

  it('takes a deactivated branch off the public list, but never the last open one', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    await services.branchAdmin.setActive('br-sz', false);
    expect((await services.org.listBranches()).map((b) => b.id)).not.toContain('br-sz');
    await services.branchAdmin.setActive('br-ma', false);
    await rejectsWith(services.branchAdmin.setActive('br-nc', false), 'Branch.LastActive');
  });

  it('saves valid hours and refuses overlapping ones', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    await services.branchAdmin.setHours('br-nc', [{ weekday: 5, ranges: [] }]);
    expect(await services.branchAdmin.getHours('br-nc')).toEqual([{ weekday: 5, ranges: [] }]);
    await rejectsWith(
      services.branchAdmin.setHours('br-nc', [{ weekday: 0, ranges: [{ from: '09:00', to: '14:00' }, { from: '13:00', to: '18:00' }] }]),
      'Branch.InvalidHours'
    );
  });

  it('adds a closure and counts the booked visits on it', async () => {
    const { services, db } = createTestBackend({ signedInAs: 'u-karim' });
    const booked = db.appointments.find((a) => a.status === 'Confirmed' && a.branchId === 'br-nc')!;
    const { affectedAppointments } = await services.branchAdmin.addHoliday({
      branchId: 'br-nc', nameEn: 'Closed', nameAr: 'مغلق', from: booked.date, to: booked.date, recursYearly: false,
    });
    expect(affectedAppointments).toBeGreaterThan(0);
    const holidays = await services.branchAdmin.listHolidays('br-nc');
    expect(holidays.some((h) => h.branchId === null)).toBe(true);
    await services.branchAdmin.removeHoliday(holidays.find((h) => h.nameEn === 'Closed')!.id);
    await rejectsWith(services.branchAdmin.removeHoliday('nope'), 'Holiday.NotFound');
  });

  it('adds rooms and takes one out of use', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const room = await services.branchAdmin.addRoom('br-ma', { nameEn: 'Procedure 1', nameAr: 'إجراءات 1', kind: 'Procedure' });
    const updated = await services.branchAdmin.updateRoom(room.id, { nameEn: 'Procedure 1', nameAr: 'إجراءات 1', kind: 'Procedure', isActive: false });
    expect(updated.isActive).toBe(false);
  });

  it('is for branch managers with branches.manage only', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mona' });
    await rejectsWith(services.branchAdmin.list(), 'Access.OutOfScope');
  });
});

describe('mock organization service', () => {
  it('saves the profile and the given settings only', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const profile = await services.organization.getProfile();
    expect((await services.organization.updateProfile({ ...profile, brandNameEn: 'ClinicFlow Care' })).brandNameEn).toBe('ClinicFlow Care');
    const settings = await services.organization.updateSettings({ cancellationWindowHours: 4 });
    expect(settings).toMatchObject({ cancellationWindowHours: 4, noShowGraceMinutes: 15 });
  });

  it('lets any staff member read the settings, but only managers of the organization change them', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mona' });
    expect((await services.organization.getSettings()).walkInCap).toBe(5);
    await rejectsWith(services.organization.updateSettings({ walkInCap: 9 }), 'Access.OutOfScope');
  });
});

describe('mock specialty admin service', () => {
  it('adds and renames specialties with unique names', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const added = await services.specialtyAdmin.create({ nameEn: 'Psychiatry', nameAr: 'الطب النفسي' });
    await rejectsWith(services.specialtyAdmin.create({ nameEn: 'psychiatry', nameAr: 'آخر' }), 'Specialty.NameTaken');
    expect((await services.specialtyAdmin.update(added.id, { nameEn: 'Mental health', nameAr: 'الطب النفسي' })).nameEn).toBe('Mental health');
    expect((await services.catalog.listSpecialties()).some((s) => s.nameEn === 'Mental health')).toBe(true);
  });
});
