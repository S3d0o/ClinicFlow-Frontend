import type { Tone } from '@/shared/ui/StatusChip';
import type { Appointment, AppointmentStatus, QueueStage } from './appointment';

/** One status → chip tone map for the whole app (design-v2/DESIGN.md, status colors). */
export const STATUS_TONE: Record<AppointmentStatus, Tone> = {
  Confirmed: 'success',
  CheckedIn: 'warning',
  InProgress: 'info',
  Completed: 'success',
  Cancelled: 'danger',
  NoShow: 'danger',
  Rescheduled: 'neutral',
};

const ACTIVE: AppointmentStatus[] = ['Confirmed', 'CheckedIn', 'InProgress'];

export const isActive = (appointment: Pick<Appointment, 'status'>) => ACTIVE.includes(appointment.status);

/** What the patient may do with their appointment right now (05 §4.1 guards, FR-PAT-09). */
export function patientActions(appointment: Appointment, now: Date) {
  const beforeStart = now.getTime() < Date.parse(appointment.startsAtUtc);
  const withinWindow = now.getTime() < Date.parse(appointment.changeableUntil);
  const confirmed = appointment.status === 'Confirmed';
  return {
    /** Cancel or reschedule online; later than the window, the patient calls the branch. */
    change: confirmed && withinWindow,
    /** The window has passed but the visit hasn't started: show "call the branch". */
    tooLateToChange: confirmed && beforeStart && !withinWindow,
    payDeposit: confirmed && beforeStart && !!appointment.depositAmount && !appointment.depositPaid,
    review: appointment.status === 'Completed' && !appointment.hasReview,
    viewSummary: appointment.status === 'Completed' && !!appointment.visitId,
  };
}

/** Upcoming: still to happen or happening; past: finished one way or another. Soonest/latest first. */
export function splitUpcomingPast(appointments: Appointment[]) {
  const upcoming = appointments.filter(isActive).sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));
  const past = appointments.filter((a) => !isActive(a)).sort((a, b) => b.startsAtUtc.localeCompare(a.startsAtUtc));
  return { upcoming, past };
}

/** The appointment to feature on the home screen: today's visit in progress, else the next one. */
export function featuredAppointment(appointments: Appointment[], today: string): Appointment | undefined {
  const { upcoming } = splitUpcomingPast(appointments);
  return upcoming.find((a) => a.date === today) ?? upcoming[0];
}

/** The patient-facing steps of a visit day (appointment details). */
export const JOURNEY = ['checkIn', 'triage', 'waiting', 'withDoctor'] as const;

// The step in progress at each queue stage; checking in is always done once there is a queue entry
const CURRENT_STEP: Record<QueueStage, number> = { WaitingTriage: 1, ReadyForDoctor: 2, WithDoctor: 3, Done: JOURNEY.length };

/** Done, current or upcoming for each journey step at a queue stage. */
export function journeySteps(stage: QueueStage) {
  const current = CURRENT_STEP[stage];
  return JOURNEY.map((key, index) => ({
    key,
    state: index < current ? ('done' as const) : index === current ? ('current' as const) : ('upcoming' as const),
  }));
}
