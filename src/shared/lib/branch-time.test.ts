import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, todayIn, utcToWallClock, wallClockIn, wallClockToUtc, weekdayOf } from './branch-time';

const CAIRO = 'Africa/Cairo';

describe('branch time', () => {
  it("reads today's date and time in the branch zone, not the device's", () => {
    // 22:30 UTC on Oct 24 is already Oct 25 in Cairo (UTC+3 in summer time)
    const instant = new Date('2026-07-24T22:30:00Z');
    expect(todayIn(CAIRO, instant)).toBe('2026-07-25');
    expect(wallClockIn(CAIRO, instant)).toBe('01:30');
    expect(todayIn('UTC', instant)).toBe('2026-07-24');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-10-24', '2026-11-03')).toBe(10);
  });

  it('gives the weekday of a date', () => {
    expect(weekdayOf('2026-10-24')).toBe(6); // Saturday
    expect(weekdayOf('2026-10-25')).toBe(0);
  });

  it('converts branch wall-clock times to UTC and back', () => {
    const instant = wallClockToUtc('2026-11-04', '11:00', CAIRO); // winter time, UTC+2
    expect(instant.toISOString()).toBe('2026-11-04T09:00:00.000Z');
    expect(utcToWallClock(instant, CAIRO)).toEqual({ date: '2026-11-04', time: '11:00' });
    expect(wallClockToUtc('2026-07-01', '11:00', CAIRO).toISOString()).toBe('2026-07-01T08:00:00.000Z');
  });
});
