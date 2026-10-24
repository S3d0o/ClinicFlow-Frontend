import { localeOf, type Language } from '@/shared/i18n/languages';

// Locale-aware display helpers. Money is EGP with 2 decimals at most (07_API_DESIGN §3); slot times
// are branch wall-clock "HH:mm" and are never time-zone converted (ADR 0003).

/** 450 → "EGP 450" (en) or "450 ج.م." (ar). */
export function formatMoney(amount: number, language: Language): string {
  return new Intl.NumberFormat(localeOf(language), {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** 1234 → "1,234" */
export function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(localeOf(language)).format(value);
}

/** "09:30" (branch wall-clock) → "9:30 AM" / "9:30 ص". */
export function formatWallClock(time: string, language: Language): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  // A fixed UTC date keeps the wall-clock value unchanged whatever the viewer's time zone is
  return new Intl.DateTimeFormat(localeOf(language), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

/**
 * A UTC timestamp (API, ends in `Z`) shown in a branch's zone, e.g. an interview time:
 * "Wed, Nov 4, 11:00 AM". Pass `timeZone` so every viewer sees the branch's wall clock.
 */
export function formatInstant(
  timestamp: string,
  language: Language,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
): string {
  return new Intl.DateTimeFormat(localeOf(language), { ...options, timeZone }).format(new Date(timestamp));
}

/** 0 (Sunday) … 6 (Saturday) → "Sunday" / "الأحد". */
export function formatWeekday(weekday: number, language: Language, style: 'long' | 'short' = 'long'): string {
  // 2026-10-18 is a Sunday
  return new Intl.DateTimeFormat(localeOf(language), { weekday: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 9, 18 + weekday)));
}

/** The Egyptian working week starts on Saturday. */
export const WEEK_FROM_SATURDAY = [6, 0, 1, 2, 3, 4, 5] as const;

/** ["Nasr City", "Maadi"] → "Nasr City and Maadi" / "مدينة نصر والمعادي". */
export function formatList(items: string[], language: Language): string {
  return new Intl.ListFormat(localeOf(language), { style: 'long', type: 'conjunction' }).format(items);
}

/** 2 400 000 bytes → "2.3 MB" (file sizes in upload lists). */
export function formatFileSize(bytes: number, language: Language): string {
  const units = ['byte', 'kilobyte', 'megabyte'] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return new Intl.NumberFormat(localeOf(language), {
    style: 'unit',
    unit: units[unit],
    unitDisplay: 'short',
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

/** "2026-10-24" → "Sat, Oct 24" / "السبت، 24 أكتوبر" (style configurable). */
export function formatDay(
  date: string,
  language: Language,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
): string {
  const [y, mo, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(localeOf(language), { ...options, timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, mo - 1, d)));
}
