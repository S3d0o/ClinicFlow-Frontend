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
