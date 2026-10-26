import { describe, expect, it } from 'vitest';
import { boardColumns, minutesInStage, queueDoctors, type QueueEntry } from './queue';

const NOW = new Date('2026-10-24T08:00:00Z');
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

const entry = (overrides: Partial<QueueEntry>): QueueEntry => ({
  appointmentId: 'a', ticketNo: 'A-01', stage: 'WaitingTriage', position: 1, patientId: 'p', patientName: 'P', mrn: 'MRN-1',
  doctorId: 'doc-b', doctorName: 'Dr. B', specialtyId: 'sp', serviceId: 'svc', source: 'Online', checkedInAt: ago(10),
  lateMinutes: 0, allergies: [], amountDue: 0,
  ...overrides,
});

describe('queue board', () => {
  it('puts entries in their stage column, in line order', () => {
    const columns = boardColumns([
      entry({ appointmentId: 'w2', position: 2 }),
      entry({ appointmentId: 'w1', position: 1 }),
      entry({ appointmentId: 'd-old', stage: 'Done', completedAt: ago(30) }),
      entry({ appointmentId: 'd-new', stage: 'Done', completedAt: ago(5) }),
    ]);
    expect(columns.map((c) => [c.stage, c.entries.map((e) => e.appointmentId)])).toEqual([
      ['WaitingTriage', ['w1', 'w2']],
      ['ReadyForDoctor', []],
      ['WithDoctor', []],
      ['Done', ['d-new', 'd-old']],
    ]);
  });

  it('measures time in the current stage', () => {
    expect(minutesInStage(entry({}), NOW)).toBe(10);
    expect(minutesInStage(entry({ stage: 'ReadyForDoctor', triagedAt: ago(4) }), NOW)).toBe(4);
    expect(minutesInStage(entry({ stage: 'WithDoctor', calledAt: ago(12) }), NOW)).toBe(12);
  });

  it('lists the doctors once, by name', () => {
    const doctors = queueDoctors([entry({}), entry({ doctorId: 'doc-a', doctorName: 'Dr. A' }), entry({})]);
    expect(doctors.map((d) => d.id)).toEqual(['doc-a', 'doc-b']);
  });
});
