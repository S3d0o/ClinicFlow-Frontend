// An iCalendar (RFC 5545) event, so "Add to calendar" works with Google, Outlook and Apple Calendar.

interface CalendarEvent {
  uid: string;
  title: string;
  /** UTC ISO 8601. */
  start: string;
  durationMinutes: number;
  location?: string;
  description?: string;
}

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Escapes text values: backslash, semicolon, comma and newlines. */
const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const end = new Date(Date.parse(event.start) + event.durationMinutes * 60_000).toISOString();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClinicFlow//Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.uid}@clinicflow`,
    `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.location && `LOCATION:${escape(event.location)}`,
    event.description && `DESCRIPTION:${escape(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `${lines.join('\r\n')}\r\n`;
}
