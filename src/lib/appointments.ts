import type { Appointment } from '@/types';

/**
 * Whether the appointment's start time has passed. Appointment dates and times are clinic
 * wall-clock time with no time zone (API contract §1), so they are read as local time.
 */
export function hasAppointmentStarted(appointment: Pick<Appointment, 'appointmentDate' | 'startTime'>): boolean {
  return new Date(`${appointment.appointmentDate}T${appointment.startTime}`) < new Date();
}
