import { describe, expect, it } from 'vitest';
import { formatFee, formatTime, formatTimeRange, getInitials, parseUtc } from './format';

describe('formatTime', () => {
  it('formats clinic wall-clock times without time-zone conversion', () => {
    expect(formatTime('09:30:00')).toBe('9:30 AM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('23:45:00')).toBe('11:45 PM');
  });

  it('returns unparseable input unchanged', () => {
    expect(formatTime('soon')).toBe('soon');
  });

  it('formats a range', () => {
    expect(formatTimeRange('09:00:00', '09:30:00')).toBe('9:00 AM – 9:30 AM');
  });
});

describe('parseUtc', () => {
  it('treats timestamps without a zone as UTC', () => {
    expect(parseUtc('2026-10-17T08:15:00').toISOString()).toBe('2026-10-17T08:15:00.000Z');
    expect(parseUtc('2026-10-17T08:15:00.123').toISOString()).toBe('2026-10-17T08:15:00.123Z');
  });

  it('keeps an explicit zone', () => {
    expect(parseUtc('2026-10-17T08:15:00Z').toISOString()).toBe('2026-10-17T08:15:00.000Z');
    expect(parseUtc('2026-10-17T11:15:00+03:00').toISOString()).toBe('2026-10-17T08:15:00.000Z');
  });
});

describe('formatFee', () => {
  it('adds the currency and thousands separators', () => {
    expect(formatFee(650)).toBe('650 EGP');
    expect(formatFee(1250.5)).toBe('1,250.5 EGP');
  });
});

describe('getInitials', () => {
  it('uses the first and last names, ignoring a "Dr." prefix', () => {
    expect(getInitials('Dr. Ahmed El-Sayed')).toBe('AE');
    expect(getInitials('dr Mona Ali Hassan')).toBe('MH');
    expect(getInitials('sara')).toBe('S');
    expect(getInitials('   ')).toBe('?');
  });
});
