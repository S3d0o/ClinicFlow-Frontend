import type { Slot } from './doctor';

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

/** Morning before 12:00, afternoon until 17:00, evening after (branch wall clock). */
export const periodOf = (startTime: string): DayPeriod => (startTime < '12:00' ? 'morning' : startTime < '17:00' ? 'afternoon' : 'evening');

/** The days that have slots, each with whether any of them is free, in date order. */
export function slotDays(slots: Slot[]): { date: string; hasFree: boolean }[] {
  const days = new Map<string, boolean>();
  for (const slot of slots) days.set(slot.date, (days.get(slot.date) ?? false) || slot.available);
  return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, hasFree]) => ({ date, hasFree }));
}

/** One day's slots grouped by period, skipping empty periods. */
export function slotsByPeriod(slots: Slot[], date: string): { period: DayPeriod; slots: Slot[] }[] {
  const periods: DayPeriod[] = ['morning', 'afternoon', 'evening'];
  const ofDay = slots.filter((s) => s.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  return periods.map((period) => ({ period, slots: ofDay.filter((s) => periodOf(s.startTime) === period) })).filter((g) => g.slots.length > 0);
}
