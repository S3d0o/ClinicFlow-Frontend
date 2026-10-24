import { describe, expect, it } from 'vitest';
import { buildIcs } from './calendar';

describe('calendar file', () => {
  it('builds a UTC event with escaped text', () => {
    const ics = buildIcs(
      {
        uid: 'app-1',
        title: 'ClinicFlow interview',
        start: '2026-11-04T09:00:00.000Z',
        durationMinutes: 60,
        location: 'Nasr City, 14 Abbas El Akkad St.',
        description: 'Bring your syndicate card; and ID',
      },
      new Date('2026-10-24T10:00:00Z')
    );
    expect(ics.split('\r\n')).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ClinicFlow//Calendar//EN',
      'BEGIN:VEVENT',
      'UID:app-1@clinicflow',
      'DTSTAMP:20261024T100000Z',
      'DTSTART:20261104T090000Z',
      'DTEND:20261104T100000Z',
      'SUMMARY:ClinicFlow interview',
      'LOCATION:Nasr City\\, 14 Abbas El Akkad St.',
      'DESCRIPTION:Bring your syndicate card\\; and ID',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ]);
  });
});
