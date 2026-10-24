import { AlertTriangle, Check, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { QueueStatus } from '../model/appointment';
import { journeySteps } from '../model/rules';

/**
 * The visit-day queue (UX_NOTES U3): ticket, place in line, estimated wait, a doctor-running-late
 * banner and the check-in → triage → waiting → doctor journey. Changes are announced politely.
 */
export function QueuePanel({ queue, doctorName }: { queue: QueueStatus; doctorName: string }) {
  const { t } = useTranslation('appointments');
  const withDoctor = queue.stage === 'WithDoctor' || queue.stage === 'Done';

  return (
    <div className="space-y-4">
      <div className="flex items-stretch gap-3">
        <div aria-live="polite" className="flex-1 rounded-xl border border-border bg-muted/50 p-3">
          <p className="text-title-sm font-display text-ink">
            {withDoctor ? t('queue.withDoctor') : t('queue.position', { count: queue.position })}
          </p>
          <p className="text-body-sm text-muted-foreground">
            {withDoctor ? queue.roomName && t('queue.room', { room: queue.roomName }) : t('queue.wait', { minutes: queue.estimatedWaitMinutes })}
          </p>
        </div>
        <div className="flex min-w-24 flex-col items-center justify-center rounded-xl bg-ink px-3 py-2 text-ink-foreground">
          <span className="text-caption uppercase tracking-[0.06em] text-ink-foreground/70">{t('queue.ticket')}</span>
          <bdi dir="ltr" className="font-display text-headline-md">
            {queue.ticketNo}
          </bdi>
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-1">
        {journeySteps(queue.stage).map((step) => (
          <li key={step.key} aria-current={step.state === 'current' ? 'step' : undefined} className="space-y-1.5 text-center">
            <span
              aria-hidden="true"
              className={cn(
                'mx-auto flex h-1.5 rounded-full',
                step.state === 'done' && 'bg-primary',
                step.state === 'current' && 'bg-info',
                step.state === 'upcoming' && 'bg-muted'
              )}
            />
            <span className={cn('inline-flex items-center gap-1 text-caption', step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}>
              {step.state === 'done' && <Check aria-hidden="true" className="size-3 text-primary" />}
              {t(`queue.journey.${step.key}`)}
            </span>
          </li>
        ))}
      </ol>

      {queue.doctorDelayMinutes && !withDoctor ? (
        <p className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 p-3 text-body-sm text-warning">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('queue.delay', { doctor: doctorName, minutes: queue.doctorDelayMinutes })}
        </p>
      ) : null}

      <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <Radio aria-hidden="true" className="size-3.5 text-success" />
        {t('queue.live')}
      </p>
    </div>
  );
}
