import type { ApplicationStatus, DoctorApplication } from './application';

/** Applied and Interview are open: the applicant can still withdraw and can't apply again (FR-REC-01). */
export const isOpen = (status: ApplicationStatus) => status === 'Applied' || status === 'Interview';

export const canWithdraw = isOpen;

export type TrackerState = 'done' | 'current' | 'upcoming' | 'stopped';

export interface TrackerStep {
  status: 'Applied' | 'Interview' | 'Accepted';
  state: TrackerState;
  /** When the application reached this step. */
  at?: string;
}

const PATH = ['Applied', 'Interview', 'Accepted'] as const;

/**
 * The three-step tracker (Applied → Interview → Accepted). A rejected or withdrawn application stops
 * at the step it had reached, which shows as "stopped".
 */
export function trackerSteps(application: Pick<DoctorApplication, 'status' | 'history'>): TrackerStep[] {
  const reachedAt = (status: ApplicationStatus) =>
    // History is newest first; the earliest change into a status is when it was reached
    application.history.filter((change) => change.toStatus === status).at(-1)?.changedAt;

  const ended = application.status === 'Rejected' || application.status === 'Withdrawn';
  // The furthest step on the happy path the application reached
  const reached = PATH.reduce((last, status, index) => (reachedAt(status) ? index : last), 0);

  return PATH.map((status, index) => {
    let state: TrackerState;
    if (index < reached) state = 'done';
    else if (index === reached) state = ended ? 'stopped' : status === 'Accepted' ? 'done' : 'current';
    else state = 'upcoming';
    return { status, state, at: reachedAt(status) };
  });
}
