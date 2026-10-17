import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canPatientCancel, hasAppointmentStarted } from './appointments';

// Appointment times are clinic wall-clock time, read as local time
const NOW = new Date('2026-10-17T12:00:00');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('hasAppointmentStarted', () => {
  it('is false before the start time and true after it', () => {
    expect(hasAppointmentStarted({ appointmentDate: '2026-10-17', startTime: '12:30:00' })).toBe(false);
    expect(hasAppointmentStarted({ appointmentDate: '2026-10-17', startTime: '11:30:00' })).toBe(true);
    expect(hasAppointmentStarted({ appointmentDate: '2026-10-16', startTime: '18:00:00' })).toBe(true);
  });
});

describe('canPatientCancel', () => {
  it('allows cancelling a confirmed appointment at least 2 hours ahead', () => {
    expect(canPatientCancel({ appointmentDate: '2026-10-17', startTime: '14:00:00', status: 'Confirmed' })).toBe(true);
    expect(canPatientCancel({ appointmentDate: '2026-10-18', startTime: '09:00:00', status: 'Confirmed' })).toBe(true);
  });

  it('blocks cancelling inside the 2-hour window', () => {
    expect(canPatientCancel({ appointmentDate: '2026-10-17', startTime: '13:59:00', status: 'Confirmed' })).toBe(false);
    expect(canPatientCancel({ appointmentDate: '2026-10-17', startTime: '11:00:00', status: 'Confirmed' })).toBe(false);
  });

  it('blocks cancelling appointments that are not confirmed', () => {
    expect(canPatientCancel({ appointmentDate: '2026-10-20', startTime: '10:00:00', status: 'Cancelled' })).toBe(false);
    expect(canPatientCancel({ appointmentDate: '2026-10-20', startTime: '10:00:00', status: 'Completed' })).toBe(false);
  });
});
