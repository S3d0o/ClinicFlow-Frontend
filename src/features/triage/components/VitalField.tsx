import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { StatusChip } from '@/shared/ui/StatusChip';
import { isPlausible, parseVital, VITAL_LIMITS, vitalFlag, type VitalKey } from '../model/vitals';

interface VitalFieldProps {
  name: VitalKey;
  value: string;
  onChange: (value: string) => void;
  /** Shown when it differs from the field's name, e.g. "Systolic" inside the blood pressure card. */
  label?: string;
  className?: string;
}

/** One measurement with its unit, normal range, a high or low flag, and a typo check (FR-EMR-02). */
export function VitalField({ name, value, onChange, label, className }: VitalFieldProps) {
  const { t } = useTranslation('triage');
  const id = useId();
  const limits = VITAL_LIMITS[name];
  const parsed = parseVital(value);
  const invalid = parsed !== undefined && (Number.isNaN(parsed) || !isPlausible(name, parsed));
  const flag = !invalid ? vitalFlag(name, parsed) : undefined;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-label-md text-foreground">{label ?? t(`vitals.${name}`)}</label>
        {flag && <StatusChip tone="warning">{t(`flags.${flag}`)}</StatusChip>}
      </div>
      <div
        dir="ltr"
        className={cn(
          'flex h-12 items-center rounded-lg border bg-card shadow-xs focus-within:ring-2 focus-within:ring-ring/25',
          invalid ? 'border-destructive' : flag ? 'border-warning' : 'border-input focus-within:border-ring'
        )}
      >
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : hintId}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-title-sm tabular-nums outline-none"
        />
        <span className="pe-3 text-body-sm text-muted-foreground">{t(`units.${name}`)}</span>
      </div>
      {invalid ? (
        <p id={errorId} className="text-body-sm font-medium text-destructive">{t('outOfRange', { min: limits.min, max: limits.max })}</p>
      ) : (
        <p id={hintId} className="text-caption text-muted-foreground">
          {limits.normal ? t('normalRange', { min: limits.normal[0], max: limits.normal[1] }) : t('accepted', { min: limits.min, max: limits.max })}
        </p>
      )}
    </div>
  );
}
