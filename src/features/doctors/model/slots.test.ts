import { describe, expect, it } from 'vitest';
import type { Slot } from './doctor';
import { periodOf, slotDays, slotsByPeriod } from './slots';

const slot = (date: string, startTime: string, available = true): Slot => ({
  id: `${date} ${startTime}`,
  doctorId: 'd',
  branchId: 'b',
  date,
  startTime,
  endTime: startTime,
  startsAtUtc: '',
  available,
});

describe('slot grouping', () => {
  it('names the period of the day', () => {
    expect(['09:30', '11:59', '12:00', '16:59', '17:00'].map(periodOf)).toEqual(['morning', 'morning', 'afternoon', 'afternoon', 'evening']);
  });

  it('lists the days in order and whether any slot is free', () => {
    const slots = [slot('2026-10-26', '10:00', false), slot('2026-10-25', '10:00'), slot('2026-10-26', '11:00', false)];
    expect(slotDays(slots)).toEqual([
      { date: '2026-10-25', hasFree: true },
      { date: '2026-10-26', hasFree: false },
    ]);
  });

  it("groups one day's slots by period in time order", () => {
    const slots = [slot('2026-10-25', '18:00'), slot('2026-10-25', '09:00'), slot('2026-10-26', '10:00'), slot('2026-10-25', '09:30')];
    expect(slotsByPeriod(slots, '2026-10-25').map((g) => [g.period, g.slots.map((s) => s.startTime)])).toEqual([
      ['morning', ['09:00', '09:30']],
      ['evening', ['18:00']],
    ]);
  });
});
