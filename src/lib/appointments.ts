import type { Appointment } from '@/types';

/**
 * Whether the appointment's start time has passed. Appointment dates and times are clinic
 * wall-clock time with no time zone (API contract §1), so they are read as local time.
 */
export function hasAppointmentStarted(appointment: Pick<Appointment, 'appointmentDate' | 'startTime'>): boolean {
  return new Date(`${appointment.appointmentDate}T${appointment.startTime}`) < new Date();
}

/** A visit can be marked as a no-show this many minutes after its start (API contract §5.4 #24b). */
export const NO_SHOW_GRACE_MINUTES = 15;

/** Whether the doctor can mark this appointment as a no-show (confirmed, and past the grace period). */
export function canMarkNoShow(appointment: Pick<Appointment, 'appointmentDate' | 'startTime' | 'status'>): boolean {
  if (appointment.status !== 'Confirmed') return false;
  const start = new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();
  return Date.now() >= start + NO_SHOW_GRACE_MINUTES * 60 * 1000;
}

/** Patients can cancel until this many hours before the start (API contract §5.4 #22). */
export const PATIENT_CANCELLATION_WINDOW_HOURS = 2;

/** Whether a patient can still cancel this appointment (confirmed, and far enough ahead). */
export function canPatientCancel(appointment: Pick<Appointment, 'appointmentDate' | 'startTime' | 'status'>): boolean {
  if (appointment.status !== 'Confirmed') return false;
  const start = new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();
  return start - Date.now() >= PATIENT_CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
}
