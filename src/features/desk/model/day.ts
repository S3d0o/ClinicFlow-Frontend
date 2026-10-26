import type { Room } from '@/features/queue/model/queue';
import type { Tone } from '@/shared/ui/StatusChip';
import type { DeskAppointment } from './desk';
import { CHECK_IN_OPENS_MINUTES, NO_SHOW_GRACE_MINUTES } from './policy';

// Rules for the front desk's day (design front-desk/01, U7). Pure, so the screens stay simple.

const MINUTE = 60_000;
const startOf = (a: Pick<DeskAppointment, 'startsAtUtc'>) => Date.parse(a.startsAtUtc);

/** Visits that still count for the day: not cancelled and not moved elsewhere. */
export const isOnTheBook = (a: Pick<DeskAppointment, 'status'>) => a.status !== 'Cancelled' && a.status !== 'Rescheduled';

/** Booked but not here yet, with the start time passed. */
export const isLate = (a: DeskAppointment, now: Date) => a.status === 'Confirmed' && now.getTime() > startOf(a);

/** Minutes past the start time (0 when not late). */
export const minutesLate = (a: DeskAppointment, now: Date) => Math.max(0, Math.floor((now.getTime() - startOf(a)) / MINUTE));

/** What the desk may do with a visit right now (05 §4.1 guards). Permissions are checked by the screen. */
export function deskActions(a: DeskAppointment, now: Date) {
  const confirmed = a.status === 'Confirmed';
  const checkInOpensAt = startOf(a) - CHECK_IN_OPENS_MINUTES * MINUTE;
  const checkedIn = a.status === 'CheckedIn' || a.status === 'InProgress' || a.status === 'Completed';
  return {
    /** The appointment is today (the list holds one day) and the window has opened. */
    checkIn: confirmed && now.getTime() >= checkInOpensAt,
    checkInOpensAt: confirmed && now.getTime() < checkInOpensAt ? new Date(checkInOpensAt).toISOString() : undefined,
    noShow: confirmed && now.getTime() >= startOf(a) + NO_SHOW_GRACE_MINUTES * MINUTE,
    collect: checkedIn && a.amountDue > 0,
  };
}

/** The four counters at the top of the day (design front-desk/01). */
export function dayCounters(appointments: DeskAppointment[]) {
  const booked = appointments.filter(isOnTheBook);
  return {
    booked: booked.length,
    checkedIn: booked.filter((a) => !!a.checkedInAt).length,
    waiting: booked.filter((a) => a.queue && (a.queue.stage === 'WaitingTriage' || a.queue.stage === 'ReadyForDoctor')).length,
    noShow: booked.filter((a) => a.status === 'NoShow').length,
  };
}

/** The "needs action" strip (U2, U7): late arrivals, visits not confirmed by the patient, unpaid visits. */
export function needsAction(appointments: DeskAppointment[], now: Date) {
  const late = appointments.filter((a) => isLate(a, now)).sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));
  const unconfirmed = appointments.filter((a) => a.status === 'Confirmed' && !a.attendanceConfirmed && !isLate(a, now));
  const unpaid = appointments.filter((a) => a.status === 'Completed' && a.amountDue > 0);
  return { late, unconfirmed, unpaid, total: late.length + unconfirmed.length + unpaid.length };
}

export interface DoctorColumn {
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  room?: Room;
  appointments: DeskAppointment[];
}

/** The day by doctor, each doctor's visits in time order; doctors by their first visit. */
export function byDoctor(appointments: DeskAppointment[]): DoctorColumn[] {
  const columns = new Map<string, DoctorColumn>();
  for (const a of [...appointments].sort((x, y) => x.startTime.localeCompare(y.startTime))) {
    const column = columns.get(a.doctorId) ?? { doctorId: a.doctorId, doctorName: a.doctorName, specialtyId: a.specialtyId, appointments: [] };
    column.room ??= a.room;
    column.appointments.push(a);
    columns.set(a.doctorId, column);
  }
  return [...columns.values()];
}

/** How a doctor's day is going: busy while someone is with them, on schedule otherwise. */
export function columnLoad(column: DoctorColumn) {
  const active = column.appointments.filter(isOnTheBook);
  const seen = active.filter((a) => a.status === 'Completed' || a.status === 'InProgress').length;
  const withDoctor = active.some((a) => a.status === 'InProgress');
  return { seen, total: active.length, tone: (withDoctor ? 'info' : 'success') as Tone, withDoctor };
}
