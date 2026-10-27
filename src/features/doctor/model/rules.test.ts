import { describe, expect, it } from 'vitest';
import { periodStart, trend } from '@/features/history/model/history';
import { canCancelLeave, hasEncounter, leaveCovers, visitState, weekStartOf } from './rules';

describe('schedule rules', () => {
  it('starts the week on Saturday', () => {
    expect(weekStartOf('2026-10-24')).toBe('2026-10-24'); // Saturday
    expect(weekStartOf('2026-10-27')).toBe('2026-10-24'); // Tuesday
    expect(weekStartOf('2026-10-30')).toBe('2026-10-24'); // Friday
  });

  it('checks which shifts a leave covers', () => {
    const allDay = { fromDate: '2026-11-02', toDate: '2026-11-04' };
    expect(leaveCovers(allDay, '2026-11-03', '09:00', '13:00')).toBe(true);
    expect(leaveCovers(allDay, '2026-11-05', '09:00', '13:00')).toBe(false);
    const morning = { fromDate: '2026-11-02', toDate: '2026-11-02', startTime: '09:00', endTime: '12:00' };
    expect(leaveCovers(morning, '2026-11-02', '11:30', '12:00')).toBe(true);
    expect(leaveCovers(morning, '2026-11-02', '16:00', '20:00')).toBe(false);
  });

  it('lets leave be cancelled only before it starts', () => {
    const leave = { id: 'l', reference: 'LV', fromDate: '2026-11-02', toDate: '2026-11-02', reason: 'x', affectedAppointments: 0, requestedAt: '' };
    expect(canCancelLeave({ ...leave, status: 'Requested' }, '2026-10-30')).toBe(true);
    expect(canCancelLeave({ ...leave, status: 'Approved' }, '2026-11-02')).toBe(false);
    expect(canCancelLeave({ ...leave, status: 'Rejected' }, '2026-10-30')).toBe(false);
  });
});

describe('the day list', () => {
  it('names where each visit stands and when its encounter opens', () => {
    expect(visitState({ status: 'Confirmed' })).toBe('booked');
    expect(visitState({ status: 'CheckedIn', queue: { ticketNo: 'A-1', stage: 'WaitingTriage' } })).toBe('triage');
    expect(visitState({ status: 'CheckedIn', queue: { ticketNo: 'A-1', stage: 'ReadyForDoctor' } })).toBe('ready');
    expect(visitState({ status: 'Completed', encounterStatus: 'Draft' })).toBe('unsigned');
    expect(visitState({ status: 'Completed', encounterStatus: 'Signed' })).toBe('signed');
    expect(hasEncounter('booked')).toBe(false);
    expect(hasEncounter('triage')).toBe(true);
  });
});

describe('history rules', () => {
  it('measures periods and trends', () => {
    expect(periodStart('12m', '2026-10-24')).toBe('2025-10-24');
    expect(periodStart('all', '2026-10-24')).toBeUndefined();
    expect(trend([{ at: '', branchId: '', systolic: 130 }, { at: '', branchId: '' }, { at: '', branchId: '', systolic: 150 }], 'systolic')).toBe(20);
    expect(trend([{ at: '', branchId: '', systolic: 130 }], 'systolic')).toBeUndefined();
  });
});
