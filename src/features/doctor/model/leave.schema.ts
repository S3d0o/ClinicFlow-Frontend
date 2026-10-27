import { z } from 'zod';

// Asking for leave (05 §4.5, FR-SCH-06). Messages are `common:validation.*` keys.

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.required');
const time = z.union([z.literal(''), z.string().regex(/^\d{2}:\d{2}$/, 'validation.required')]);

/** The form's schema; `today` (branch date) is the earliest start. */
export const leaveSchema = (today: string) =>
  z
    .object({
      fromDate: date.refine((d) => d >= today, 'validation.notPast'),
      toDate: date,
      scope: z.enum(['allDay', 'hours']),
      startTime: time,
      endTime: time,
      reason: z.string().trim().min(1, 'validation.required').max(500, 'validation.maxLength'),
    })
    .superRefine((values, ctx) => {
      if (values.toDate && values.fromDate && values.toDate < values.fromDate) {
        ctx.addIssue({ code: 'custom', path: ['toDate'], message: 'validation.dateRange' });
      }
      if (values.scope === 'hours') {
        if (!values.startTime) ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'validation.required' });
        if (!values.endTime) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'validation.required' });
        if (values.startTime && values.endTime && values.endTime <= values.startTime) {
          ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'validation.timeRange' });
        }
      }
    });

export type LeaveValues = z.infer<ReturnType<typeof leaveSchema>>;

/** What the schedule service takes: times only for part of a day. */
export const toLeaveInput = ({ fromDate, toDate, scope, startTime, endTime, reason }: LeaveValues) => ({
  fromDate,
  toDate,
  ...(scope === 'hours' ? { startTime, endTime } : {}),
  reason,
});
