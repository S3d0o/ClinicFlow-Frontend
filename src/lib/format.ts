import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

// Display helpers. See docs/ARCHITECTURE.md §8 for the API's date/time conventions.

/** Clinic wall-clock time "HH:mm" or "HH:mm:ss" → "9:30 AM". Never time-zone converted. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** "9:30 AM – 10:00 AM" */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** A "yyyy-MM-dd" date → e.g. "Mon, Oct 12, 2026". */
export function formatDate(date: string, pattern = 'EEE, MMM d, yyyy'): string {
  return format(parseISO(date), pattern);
}

/** "Today", "Tomorrow", "Yesterday", or a short date, for a "yyyy-MM-dd" date. */
export function formatRelativeDay(date: string): string {
  const d = parseISO(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

/**
 * API timestamps are UTC but often lack the "Z" suffix (API contract §1). Parsing them as-is
 * would treat them as local time, so the suffix is added when missing.
 */
export function parseUtc(timestamp: string): Date {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(timestamp);
  return new Date(hasZone ? timestamp : `${timestamp}Z`);
}

/** "3 hours ago" for an API timestamp. */
export function formatTimeAgo(timestamp: string): string {
  return formatDistanceToNow(parseUtc(timestamp), { addSuffix: true });
}

/** 650 → "650 EGP" */
export function formatFee(amount: number): string {
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} EGP`;
}

/** Initials for an avatar, ignoring a "Dr." prefix: "Dr. Ahmed El-Sayed" → "AE". */
export function getInitials(name: string): string {
  const parts = name
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}
