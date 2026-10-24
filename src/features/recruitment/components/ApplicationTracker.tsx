import { Ban, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatInstant } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import type { TrackerStep } from '../model/stages';

/** Applied → Interview → Accepted, with the date each step was reached. */
export function ApplicationTracker({ steps }: { steps: TrackerStep[] }) {
  const { t } = useTranslation('recruitment');
  const { language } = useLanguage();

  return (
    <section aria-label={t('mine.tracker')} className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <li key={step.status} aria-current={step.state === 'current' ? 'step' : undefined} className="relative flex flex-col items-center gap-2 text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn('absolute end-1/2 top-4 h-0.5 w-full -translate-y-1/2', step.state === 'upcoming' ? 'bg-border' : 'bg-primary')}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-card text-label-md',
                step.state === 'done' && 'border-success text-success',
                step.state === 'current' && 'border-primary bg-primary text-primary-foreground ring-4 ring-secondary',
                step.state === 'stopped' && 'border-destructive text-destructive',
                step.state === 'upcoming' && 'border-border text-muted-foreground'
              )}
            >
              {step.state === 'done' ? <Check className="size-4" /> : step.state === 'stopped' ? <Ban className="size-4" /> : index + 1}
            </span>
            <span className={cn('text-label-md', step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}>{t(`status.${step.status}`)}</span>
            <span className="text-caption text-muted-foreground">
              {step.state === 'stopped'
                ? t('mine.trackerStopped')
                : step.at
                  ? formatInstant(step.at, language, 'Africa/Cairo', { day: 'numeric', month: 'short', year: 'numeric' })
                  : t('mine.pending')}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
