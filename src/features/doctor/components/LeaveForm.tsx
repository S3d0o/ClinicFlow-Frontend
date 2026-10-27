import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CalendarPlus, Send } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useLeaveImpact, useRequestLeave } from '../hooks/use-doctor';
import { leaveSchema, toLeaveInput, type LeaveValues } from '../model/leave.schema';

const EMPTY: LeaveValues = { fromDate: '', toDate: '', scope: 'allDay', startTime: '', endTime: '', reason: '' };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Asking for leave, with the booked visits it would touch shown before sending (05 §4.5, FR-SCH-06). */
export function LeaveForm({ today }: { today: string }) {
  const { t } = useTranslation('doctor');
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const { branchLabel } = useLookups();
  const request = useRequestLeave();
  const form = useForm<LeaveValues>({ resolver: zodResolver(leaveSchema(today)), defaultValues: EMPTY });
  const { errors } = form.formState;

  const [fromDate, toDate, scope, startTime, endTime] = useWatch({ control: form.control, name: ['fromDate', 'toDate', 'scope', 'startTime', 'endTime'] });
  const range = useDebouncedValue({ fromDate, toDate, scope, startTime, endTime });
  const ready =
    DATE.test(range.fromDate) && DATE.test(range.toDate) && range.fromDate >= today && range.toDate >= range.fromDate &&
    (range.scope === 'allDay' || (!!range.startTime && !!range.endTime && range.startTime < range.endTime));
  const impact = useLeaveImpact(ready ? toLeaveInput({ ...range, reason: '' }) : null);

  const submit = form.handleSubmit(async (values) => {
    try {
      const leave = await request.mutateAsync(toLeaveInput(values));
      toast.success(t('leave.requested', { reference: leave.reference }));
      form.reset(EMPTY);
    } catch {
      // Shown from request.error below
    }
  });

  return (
    <section aria-labelledby="leave-form" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <header className="space-y-1">
        <h2 id="leave-form" className="flex items-center gap-2 text-title-sm text-ink">
          <CalendarPlus aria-hidden="true" className="size-5 text-primary" />
          {t('leave.formTitle')}
        </h2>
        <p className="text-body-sm text-muted-foreground">{t('leave.formHint')}</p>
      </header>
      <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('leave.from')} error={validation(errors.fromDate?.message)} required>
              {(control) => <Input {...control} type="date" min={today} {...form.register('fromDate')} />}
            </Field>
            <Field label={t('leave.to')} error={validation(errors.toDate?.message)} required>
              {(control) => <Input {...control} type="date" min={fromDate || today} {...form.register('toDate')} />}
            </Field>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-label-md">{t('leave.scope')}</legend>
            <div className="flex flex-wrap gap-4">
              {(['allDay', 'hours'] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 text-body-md">
                  <input type="radio" value={value} {...form.register('scope')} className="size-4 accent-[hsl(var(--primary))]" />
                  {t(`leave.scopes.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>
          {scope === 'hours' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('leave.startTime')} error={validation(errors.startTime?.message)} required>
                {(control) => <Input {...control} type="time" {...form.register('startTime')} />}
              </Field>
              <Field label={t('leave.endTime')} error={validation(errors.endTime?.message)} required>
                {(control) => <Input {...control} type="time" {...form.register('endTime')} />}
              </Field>
            </div>
          )}
          <Field label={t('leave.reason')} hint={t('leave.reasonHint')} error={validation(errors.reason?.message, { max: 500 })} required>
            {(control) => <Textarea {...control} {...form.register('reason')} rows={3} dir="auto" />}
          </Field>
        </div>

        <div className="space-y-4">
          <div
            role="status"
            className={cn(
              'space-y-2 rounded-xl border p-4',
              impact.data && impact.data.affected > 0 ? 'border-warning/40 bg-warning/10' : 'border-border bg-muted/40'
            )}
          >
            <h3 className="flex items-center gap-2 text-title-sm text-ink">
              {impact.data && impact.data.affected > 0 && <AlertTriangle aria-hidden="true" className="size-5 text-warning" />}
              {t('leave.impactTitle')}
            </h3>
            {!ready ? (
              <p className="text-body-sm text-muted-foreground">{t('leave.impactPending')}</p>
            ) : impact.isPending ? (
              <p className="text-body-sm text-muted-foreground">{t('leave.impactLoading')}</p>
            ) : impact.isError ? (
              <p className="text-body-sm text-destructive">{errorMessage(impact.error)}</p>
            ) : (
              <>
                <p className="text-body-md">
                  {t('leave.impactShifts', { count: impact.data.shifts })} {t('leave.impactAffected', { count: impact.data.affected })}
                </p>
                {impact.data.byBranch.length > 0 && (
                  <ul className="text-body-sm text-muted-foreground">
                    {impact.data.byBranch.map((b) => (
                      <li key={b.branchId}>{t('leave.impactBranch', { branch: branchLabel(b.branchId), count: b.count })}</li>
                    ))}
                  </ul>
                )}
                {impact.data.affected > 0 && <p className="text-body-sm text-muted-foreground">{t('leave.impactNext')}</p>}
              </>
            )}
          </div>
          {request.isError && (
            <FormAlert>{errorMessage(request.error)}</FormAlert>
          )}
          <Button type="submit" size="lg" variant="strong" className="w-full" disabled={request.isPending}>
            <Send aria-hidden="true" className="rtl-flip" />
            {t('leave.submit')}
          </Button>
        </div>
      </form>
    </section>
  );
}
