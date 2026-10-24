import { describe, expect, it } from 'vitest';
import type { Appointment } from './appointment';
import { featuredAppointment, journeySteps, patientActions, splitUpcomingPast } from './rules';

const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'a1',
  reference: 'CF-26-00001',
  status: 'Confirmed',
  source: 'Online',
  doctorId: 'd',
  doctorName: 'Dr. X',
  specialtyId: 's',
  branchId: 'b',
  serviceId: 'svc',
  date: '2026-10-26',
  startTime: '10:00',
  endTime: '10:30',
  startsAtUtc: '2026-10-26T07:00:00Z',
  price: 450,
  depositAmount: 100,
  depositPaid: false,
  bookedAt: '2026-10-20T10:00:00Z',
  changeableUntil: '2026-10-26T05:00:00Z',
  attendanceConfirmed: false,
  hasReview: false,
  ...overrides,
});

describe('patient actions (FR-PAT-09, 05 §4.1)', () => {
  it('allows changes and a deposit before the change window closes', () => {
    expect(patientActions(appointment(), new Date('2026-10-25T12:00:00Z'))).toMatchObject({
      change: true,
      tooLateToChange: false,
      payDeposit: true,
    });
  });

  it('asks the patient to call once the window has closed, until the visit starts', () => {
    expect(patientActions(appointment(), new Date('2026-10-26T06:00:00Z'))).toMatchObject({ change: false, tooLateToChange: true });
    expect(patientActions(appointment(), new Date('2026-10-26T08:00:00Z'))).toMatchObject({ change: false, tooLateToChange: false });
  });

  it('offers no deposit when it is paid or the service has none', () => {
    const now = new Date('2026-10-25T12:00:00Z');
    expect(patientActions(appointment({ depositPaid: true }), now).payDeposit).toBe(false);
    expect(patientActions(appointment({ depositAmount: undefined }), now).payDeposit).toBe(false);
  });

  it('allows a review and the summary after a completed visit', () => {
    const now = new Date('2026-10-27T12:00:00Z');
    expect(patientActions(appointment({ status: 'Completed', visitId: 'v1' }), now)).toMatchObject({ review: true, viewSummary: true, change: false });
    expect(patientActions(appointment({ status: 'Completed', hasReview: true }), now)).toMatchObject({ review: false, viewSummary: false });
  });
});

describe('upcoming and past', () => {
  const today = appointment({ id: 'today', status: 'CheckedIn', date: '2026-10-24', startsAtUtc: '2026-10-24T09:00:00Z' });
  const later = appointment({ id: 'later', startsAtUtc: '2026-10-30T09:00:00Z', date: '2026-10-30' });
  const done = appointment({ id: 'done', status: 'Completed', startsAtUtc: '2026-10-10T09:00:00Z' });
  const cancelled = appointment({ id: 'cancelled', status: 'Cancelled', startsAtUtc: '2026-10-20T09:00:00Z' });

  it('puts active visits first by time and finished ones newest first', () => {
    const { upcoming, past } = splitUpcomingPast([done, later, cancelled, today]);
    expect(upcoming.map((a) => a.id)).toEqual(['today', 'later']);
    expect(past.map((a) => a.id)).toEqual(['cancelled', 'done']);
  });

  it("features today's visit, else the next one", () => {
    expect(featuredAppointment([later, today], '2026-10-24')?.id).toBe('today');
    expect(featuredAppointment([later, done], '2026-10-24')?.id).toBe('later');
    expect(featuredAppointment([done], '2026-10-24')).toBeUndefined();
  });
});

describe('visit-day journey', () => {
  const states = (stage: Parameters<typeof journeySteps>[0]) => journeySteps(stage).map((s) => s.state);

  it('marks the step in progress at each queue stage', () => {
    expect(states('WaitingTriage')).toEqual(['done', 'current', 'upcoming', 'upcoming']);
    expect(states('ReadyForDoctor')).toEqual(['done', 'done', 'current', 'upcoming']);
    expect(states('WithDoctor')).toEqual(['done', 'done', 'done', 'current']);
    expect(states('Done')).toEqual(['done', 'done', 'done', 'done']);
  });
});
