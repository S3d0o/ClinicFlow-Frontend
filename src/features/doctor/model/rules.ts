import { addDays, weekdayOf } from '@/shared/lib/branch-time';
import type { Tone } from '@/shared/ui/StatusChip';
import type { DoctorVisit, LeaveRequest, ShiftDay } from './doctor-day';

// Rules for the doctor's day and schedule. Pure.

const MINUTE = 60_000;
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** The next patient to call: the first one ready for the doctor, by place in line (FR-FD-05). */
export const nextPatient = (visits: DoctorVisit[]) =>
  visits
    .filter((v) => v.queue?.stage === 'ReadyForDoctor')
    .sort((a, b) => (a.queuePosition ?? 99) - (b.queuePosition ?? 99) || (a.checkedInAt ?? '').localeCompare(b.checkedInAt ?? ''))[0];

/** The patient in the room, if any. */
export const inRoom = (visits: DoctorVisit[]) => visits.find((v) => v.status === 'InProgress');

/** The day's counters: seen out of booked, waiting, and the average consultation in minutes. */
export function dayStats(visits: DoctorVisit[]) {
  const booked = visits.filter((v) => v.status !== 'Cancelled' && v.status !== 'Rescheduled');
  const seen = booked.filter((v) => v.status === 'Completed');
  const durations = seen
    .filter((v) => v.calledAt && v.completedAt)
    .map((v) => (Date.parse(v.completedAt!) - Date.parse(v.calledAt!)) / MINUTE);
  return {
    booked: booked.length,
    seen: seen.length,
    waiting: booked.filter((v) => v.queue && (v.queue.stage === 'WaitingTriage' || v.queue.stage === 'ReadyForDoctor')).length,
    ready: booked.filter((v) => v.queue?.stage === 'ReadyForDoctor').length,
    averageConsultMinutes: durations.length ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10 : undefined,
  };
}

/** Unsigned for more than 24 h: flagged to the doctor and later on the manager's dashboard (FR-EMR-09). */
export const isOverdue = (completedAt: string, now: Date) => now.getTime() - Date.parse(completedAt) > 24 * 60 * MINUTE;

/** Minutes a shift lasts. */
export const shiftMinutes = (shift: Pick<ShiftDay, 'startTime' | 'endTime'>) => Math.max(0, toMinutes(shift.endTime) - toMinutes(shift.startTime));

/** The Saturday that starts the Egyptian working week containing `date`. */
export function weekStartOf(date: string): string {
  const back = (weekdayOf(date) - 6 + 7) % 7; // Saturday is 6
  return addDays(date, -back);
}

/** Leave can be cancelled until it starts, while it's requested or approved (05 §4.5). */
export const canCancelLeave = (leave: LeaveRequest, today: string) =>
  (leave.status === 'Requested' || leave.status === 'Approved') && leave.fromDate > today;

/** Whether a branch-local time on `date` falls inside a leave. */
export function leaveCovers(leave: Pick<LeaveRequest, 'fromDate' | 'toDate' | 'startTime' | 'endTime'>, date: string, startTime: string, endTime: string) {
  if (date < leave.fromDate || date > leave.toDate) return false;
  if (!leave.startTime || !leave.endTime) return true;
  return toMinutes(startTime) < toMinutes(leave.endTime) && toMinutes(endTime) > toMinutes(leave.startTime);
}

/** Where a visit stands for the doctor, one word for the day list. */
export type VisitState = 'booked' | 'triage' | 'ready' | 'withDoctor' | 'unsigned' | 'signed' | 'noShow' | 'cancelled';

export function visitState(visit: Pick<DoctorVisit, 'status' | 'queue' | 'encounterStatus'>): VisitState {
  switch (visit.status) {
    case 'Confirmed':
      return 'booked';
    case 'CheckedIn':
      return visit.queue?.stage === 'ReadyForDoctor' ? 'ready' : 'triage';
    case 'InProgress':
      return 'withDoctor';
    case 'Completed':
      return visit.encounterStatus === 'Signed' ? 'signed' : 'unsigned';
    case 'NoShow':
      return 'noShow';
    default:
      return 'cancelled';
  }
}

export const VISIT_STATE_TONE: Record<VisitState, Tone> = {
  booked: 'neutral',
  triage: 'info',
  ready: 'highlight',
  withDoctor: 'primary',
  unsigned: 'warning',
  signed: 'success',
  noShow: 'danger',
  cancelled: 'neutral',
};

/** The doctor can open the encounter once the patient has checked in (FR-EMR-01). */
export const hasEncounter = (state: VisitState) => state !== 'booked' && state !== 'noShow' && state !== 'cancelled';
