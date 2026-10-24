import { useTranslation } from 'react-i18next';

/** "STEP 1 OF 2 · Your details" with a bar, for short mobile flows (sign-up, recovery). */
export function FlowProgress({ step, total, label, next }: { step: number; total: number; label: string; next?: string }) {
  const { t } = useTranslation('common');
  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-label-sm uppercase tracking-[0.06em]">
        <p className="text-foreground">
          <span className="text-highlight-strong">{t('stepper.progress', { current: step, total })}</span> · {label}
        </p>
        {next && <p className="hidden normal-case tracking-normal text-muted-foreground sm:block">{next}</p>}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={t('stepper.progress', { current: step, total })}
        className="flex gap-1.5"
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  );
}
