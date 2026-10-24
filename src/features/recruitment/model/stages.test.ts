import { describe, expect, it } from 'vitest';
import type { ApplicationStatus, StageChange } from './application';
import { canWithdraw, trackerSteps } from './stages';

const change = (fromStatus: ApplicationStatus | null, toStatus: ApplicationStatus, changedAt: string): StageChange => ({
  id: changedAt,
  fromStatus,
  toStatus,
  changedAt,
  emailSent: true,
});

const applied = change(null, 'Applied', '2026-10-01T10:00:00Z');
const interview = change('Applied', 'Interview', '2026-10-05T10:00:00Z');

const states = (status: ApplicationStatus, history: StageChange[]) => trackerSteps({ status, history }).map((s) => s.state);

describe('application tracker', () => {
  it('shows the current step and the ones before it as done', () => {
    expect(states('Applied', [applied])).toEqual(['current', 'upcoming', 'upcoming']);
    expect(states('Interview', [interview, applied])).toEqual(['done', 'current', 'upcoming']);
    expect(states('Accepted', [change('Interview', 'Accepted', '2026-10-09T10:00:00Z'), interview, applied])).toEqual([
      'done',
      'done',
      'done',
    ]);
  });

  it('stops at the step a rejected or withdrawn application had reached', () => {
    expect(states('Rejected', [change('Applied', 'Rejected', '2026-10-03T10:00:00Z'), applied])).toEqual([
      'stopped',
      'upcoming',
      'upcoming',
    ]);
    expect(states('Withdrawn', [change('Interview', 'Withdrawn', '2026-10-06T10:00:00Z'), interview, applied])).toEqual([
      'done',
      'stopped',
      'upcoming',
    ]);
  });

  it('dates each step from the first time it was reached, even after a rescheduled interview', () => {
    const rescheduled = change('Interview', 'Interview', '2026-10-07T10:00:00Z');
    const steps = trackerSteps({ status: 'Interview', history: [rescheduled, interview, applied] });
    expect(steps[1].at).toBe('2026-10-05T10:00:00Z');
  });

  it('lets the applicant withdraw only before a decision', () => {
    expect(canWithdraw('Applied')).toBe(true);
    expect(canWithdraw('Interview')).toBe(true);
    expect(canWithdraw('Accepted')).toBe(false);
    expect(canWithdraw('Rejected')).toBe(false);
  });
});
