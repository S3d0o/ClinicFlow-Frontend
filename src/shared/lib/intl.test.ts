import { describe, expect, it } from 'vitest';
import { formatDay, formatFileSize, formatInstant, formatMoney, formatWallClock } from './intl';

describe('locale-aware formatting', () => {
  it('formats EGP amounts with Latin digits in both languages', () => {
    expect(formatMoney(450, 'en')).toMatch(/EGP\s?450/);
    expect(formatMoney(38450.5, 'en')).toMatch(/38,450\.50/);
    expect(formatMoney(450, 'ar')).toContain('450');
    expect(formatMoney(450, 'ar')).toMatch(/ج\.م/);
  });

  it('keeps branch wall-clock times unchanged', () => {
    expect(formatWallClock('09:30', 'en')).toBe('9:30 AM');
    expect(formatWallClock('17:05', 'en')).toBe('5:05 PM');
    expect(formatWallClock('09:30', 'ar')).toContain('9:30');
  });

  it('formats dates without shifting the day', () => {
    expect(formatDay('2026-10-24', 'en')).toBe('Sat, Oct 24');
    expect(formatDay('2026-10-24', 'ar')).toContain('24');
  });

  it("shows a UTC timestamp in the branch's zone", () => {
    const options = { hour: 'numeric', minute: '2-digit' } as const;
    expect(formatInstant('2026-11-04T09:00:00Z', 'en', 'Africa/Cairo', options)).toBe('11:00 AM');
    expect(formatInstant('2026-11-04T09:00:00Z', 'en', 'UTC', options)).toBe('9:00 AM');
  });

  it('formats file sizes', () => {
    expect(formatFileSize(512, 'en')).toBe('512 byte');
    expect(formatFileSize(2_400_000, 'en')).toBe('2.3 MB');
  });
});
