import { describe, expect, it } from 'vitest';
import { holidayCovers, hoursProblem, openMinutes, type Holiday } from './branch-admin';

describe('hoursProblem', () => {
  it('accepts back-to-back periods and a closed day', () => {
    expect(hoursProblem({ weekday: 6, ranges: [{ from: '09:00', to: '15:00' }, { from: '15:00', to: '22:00' }] })).toBeNull();
    expect(hoursProblem({ weekday: 5, ranges: [] })).toBeNull();
  });

  it('refuses a period that closes before it opens, and overlapping periods', () => {
    expect(hoursProblem({ weekday: 0, ranges: [{ from: '18:00', to: '09:00' }] })).toBe('order');
    expect(hoursProblem({ weekday: 0, ranges: [{ from: '13:00', to: '20:00' }, { from: '09:00', to: '14:00' }] })).toBe('overlap');
  });
});

describe('openMinutes', () => {
  it('adds up the periods', () => {
    expect(openMinutes({ weekday: 1, ranges: [{ from: '09:00', to: '15:00' }, { from: '16:00', to: '21:30' }] })).toBe(690);
  });
});

describe('holidayCovers', () => {
  const holiday = (from: string, to: string, recursYearly: boolean): Holiday => ({ id: 'h', branchId: null, nameEn: '', nameAr: '', from, to, recursYearly });

  it('covers the days of a one-off closure only', () => {
    expect(holidayCovers(holiday('2026-11-03', '2026-11-05', false), '2026-11-04')).toBe(true);
    expect(holidayCovers(holiday('2026-11-03', '2026-11-05', false), '2027-11-04')).toBe(false);
  });

  it('covers the same days every year when it repeats, across New Year too', () => {
    expect(holidayCovers(holiday('2026-01-25', '2026-01-25', true), '2031-01-25')).toBe(true);
    expect(holidayCovers(holiday('2026-12-30', '2027-01-02', true), '2028-01-01')).toBe(true);
    expect(holidayCovers(holiday('2026-12-30', '2027-01-02', true), '2028-01-03')).toBe(false);
  });
});
