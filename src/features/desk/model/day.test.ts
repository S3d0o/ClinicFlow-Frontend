import { describe, expect, it } from 'vitest';
import { byDoctor, dayCounters, deskActions, needsAction } from './day';
import type { DeskAppointment } from './desk';

const NOW = new Date('2026-10-24T08:00:00Z');
const at = (minutesFromNow: number) => new Date(NOW.getTime() + minutesFromNow * 60_000).toISOString();

const visit = (overrides: Partial<DeskAppointment>): DeskAppointment => ({
  id: 'a', reference: 'CF-1', status: 'Confirmed', source: 'Online',
  patient: { id: 'p', fullName: 'Patient', mrn: 'MRN-1', phone: '+201000000000' },
  doctorId: 'doc-1', doctorName: 'Dr. One', specialtyId: 'sp', serviceId: 'svc', branchId: 'br',
  date: '2026-10-24', startTime: '10:00', endTime: '10:30', startsAtUtc: at(0),
  price: 400, depositPaid: false, attendanceConfirmed: false, amountDue: 400, invoiced: false,
  ...overrides,
});

describe('desk actions', () => {
  it('opens check-in an hour before, allows a no-show after 15 minutes, and collection once checked in', () => {
    expect(deskActions(visit({ startsAtUtc: at(61) }), NOW)).toMatchObject({ checkIn: false, checkInOpensAt: at(1), noShow: false });
    expect(deskActions(visit({ startsAtUtc: at(60) }), NOW)).toMatchObject({ checkIn: true, checkInOpensAt: undefined });
    expect(deskActions(visit({ startsAtUtc: at(-14) }), NOW).noShow).toBe(false);
    expect(deskActions(visit({ startsAtUtc: at(-15) }), NOW).noShow).toBe(true);
    expect(deskActions(visit({ status: 'Completed' }), NOW)).toMatchObject({ checkIn: false, collect: true });
    expect(deskActions(visit({ status: 'Completed', amountDue: 0 }), NOW).collect).toBe(false);
  });
});

describe('the day', () => {
  const day = [
    visit({ id: 'late', startsAtUtc: at(-20), startTime: '09:40' }),
    visit({ id: 'coming', startsAtUtc: at(30), startTime: '10:30', attendanceConfirmed: true }),
    visit({ id: 'unconfirmed', startsAtUtc: at(60), startTime: '11:00' }),
    visit({ id: 'waiting', status: 'CheckedIn', checkedInAt: at(-5), queue: { ticketNo: 'A-1', stage: 'WaitingTriage' }, startTime: '09:50' }),
    visit({ id: 'unpaid', status: 'Completed', checkedInAt: at(-90), amountDue: 200, doctorId: 'doc-2', doctorName: 'Dr. Two', startTime: '08:00' }),
    visit({ id: 'noshow', status: 'NoShow', startTime: '07:30' }),
    visit({ id: 'cancelled', status: 'Cancelled', startTime: '09:00' }),
  ];

  it('counts what is on the book', () => {
    expect(dayCounters(day)).toEqual({ booked: 6, checkedIn: 2, waiting: 1, noShow: 1 });
  });

  it('lists late arrivals, unconfirmed visits and unpaid visits', () => {
    const action = needsAction(day, NOW);
    expect(action.late.map((a) => a.id)).toEqual(['late']);
    expect(action.unconfirmed.map((a) => a.id)).toEqual(['unconfirmed']);
    expect(action.unpaid.map((a) => a.id)).toEqual(['unpaid']);
    expect(action.total).toBe(3);
  });

  it('groups by doctor in time order', () => {
    const columns = byDoctor(day);
    expect(columns.map((c) => c.doctorId)).toEqual(['doc-1', 'doc-2']);
    expect(columns[0].appointments.map((a) => a.id)).toEqual(['noshow', 'cancelled', 'late', 'waiting', 'coming', 'unconfirmed']);
  });
});
