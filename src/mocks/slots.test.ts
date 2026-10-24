import { describe, expect, it } from 'vitest';
import { generateSlots } from './slots';
import type { DoctorSeed } from './seed/doctors';

const doctor: DoctorSeed = {
  id: 'doc-x',
  userId: 'u-x',
  specialtyId: 'sp',
  licenseNo: 'L',
  yearsOfExperience: 1,
  languages: ['ar'],
  isPublic: true,
  services: [],
  slotMinutes: 30,
  schedule: [
    { branchId: 'br-a', weekday: 6, startTime: '09:00', endTime: '10:30' }, // Saturday
    { branchId: 'br-b', weekday: 0, startTime: '17:00', endTime: '18:00' }, // Sunday
  ],
};

const CAIRO = 'Africa/Cairo';

describe('slot generation', () => {
  it("makes slots from the doctor's weekly shifts, per branch", () => {
    const slots = generateSlots(doctor, { from: '2026-10-24', days: 2, timeZone: CAIRO, now: new Date('2026-10-23T12:00:00Z') });
    expect(slots.map((s) => `${s.branchId} ${s.date} ${s.startTime}-${s.endTime}`)).toEqual([
      'br-a 2026-10-24 09:00-09:30',
      'br-a 2026-10-24 09:30-10:00',
      'br-a 2026-10-24 10:00-10:30',
      'br-b 2026-10-25 17:00-17:30',
      'br-b 2026-10-25 17:30-18:00',
    ]);
    expect(slots[0].startsAtUtc).toBe('2026-10-24T06:00:00.000Z');
  });

  it('filters by branch and leaves out slots that have started', () => {
    // 09:40 in Cairo on Saturday the 24th (summer time, UTC+3)
    const now = new Date('2026-10-24T06:40:00Z');
    const slots = generateSlots(doctor, { branchId: 'br-a', from: '2026-10-24', days: 7, timeZone: CAIRO, now });
    expect(slots.filter((s) => s.date === '2026-10-24').map((s) => s.startTime)).toEqual(['10:00']);
    expect(slots.every((s) => s.branchId === 'br-a')).toBe(true);
  });

  it('marks the same slots as taken every time', () => {
    const options = { from: '2026-10-24', days: 14, timeZone: CAIRO, now: new Date('2026-10-23T12:00:00Z') };
    expect(generateSlots(doctor, options)).toEqual(generateSlots(doctor, options));
  });
});
