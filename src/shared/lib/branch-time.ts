// Branch wall-clock dates and times (ADR 0003): a date is "yyyy-MM-dd" and a time "HH:mm" in the
// branch's IANA zone, whatever zone the viewer's device is in. Date arithmetic runs on UTC midnights,
// so it never crosses a daylight-saving boundary.

const pad = (n: number) => String(n).padStart(2, '0');

/** The calendar fields of `instant` as seen in `timeZone`. */
function partsIn(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Today's date in `timeZone`. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const { year, month, day } = partsIn(now, timeZone);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The wall-clock time "HH:mm" in `timeZone`. */
export function wallClockIn(timeZone: string, now: Date = new Date()): string {
  const { hour, minute } = partsIn(now, timeZone);
  return `${pad(hour)}:${pad(minute)}`;
}

const toUtcMidnight = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const fromUtcMidnight = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** "2026-10-31" + 1 → "2026-11-01". */
export const addDays = (date: string, days: number) => fromUtcMidnight(toUtcMidnight(date) + days * 86_400_000);

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string) => Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / 86_400_000);

/** 0 = Sunday … 6 = Saturday. */
export const weekdayOf = (date: string) => new Date(toUtcMidnight(date)).getUTCDay();

/** The UTC instant of a wall-clock date and time in `timeZone`. */
export function wallClockToUtc(date: string, time: string, timeZone: string): Date {
  const [h, m] = time.split(':').map(Number);
  const asIfUtc = toUtcMidnight(date) + (h * 60 + m) * 60_000;
  // The zone's offset at that moment; checked twice so a time next to a DST change lands correctly
  const offsetAt = (ms: number) => {
    const p = partsIn(new Date(ms), timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
  };
  const first = asIfUtc - offsetAt(asIfUtc);
  return new Date(asIfUtc - offsetAt(first));
}

/** The wall-clock date and time of a UTC instant in `timeZone`. */
export function utcToWallClock(instant: Date, timeZone: string): { date: string; time: string } {
  return { date: todayIn(timeZone, instant), time: wallClockIn(timeZone, instant) };
}
