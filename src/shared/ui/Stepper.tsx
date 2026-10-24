import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

export interface Step {
  label: ReactNode;
  description?: ReactNode;
}

interface StepperProps {
  steps: Step[];
  /** Index of the current step; earlier steps show as done. */
  current: number;
  className?: string;
}

/** Progress through a multi-step form: numbered steps on wide screens, a bar and "Step 2 of 4" on phones. */
export function Stepper({ steps, current, className }: StepperProps) {
  const { t } = useTranslation('common');
  const progress = ((current + 1) / steps.length) * 100;

  return (
    <nav aria-label={t('stepper.label')} className={cn('rounded-xl border border-border bg-card p-4 sm:p-5', className)}>
      <p className="mb-3 text-label-md text-muted-foreground sm:hidden">
        {t('stepper.progress', { current: current + 1, total: steps.length })} · <span className="text-foreground">{steps[current]?.label}</span>
      </p>
      <ol className="hidden gap-4 sm:grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={index} aria-current={active ? 'step' : undefined} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-label-md',
                  done && 'border-primary/30 bg-secondary text-primary',
                  active && 'border-primary bg-primary text-primary-foreground ring-4 ring-secondary',
                  !done && !active && 'border-border bg-card text-muted-foreground'
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-caption text-muted-foreground">
                  {t('stepper.step', { n: index + 1 })}
                  <span className="sr-only">
                    {' '}
                    ({done ? t('stepper.done') : active ? t('stepper.current') : t('stepper.upcoming')})
                  </span>
                </span>
                <span className={cn('block text-label-md', active || done ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
                {step.description && <span className="block text-body-sm text-muted-foreground">{step.description}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted sm:mt-4">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </nav>
  );
}
