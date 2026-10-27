import { useTranslation } from 'react-i18next';
import { bloodPressure, bmi, vitalFlag, type Vitals, type VitalKey } from '@/features/triage/model/vitals';
import { cn } from '@/shared/lib/cn';

type Shown = 'bloodPressure' | Exclude<VitalKey, 'systolic' | 'diastolic' | 'heightCm' | 'painScore'>;

const SHOWN: Shown[] = ['bloodPressure', 'pulse', 'spo2', 'temperature', 'respiratoryRate', 'weightKg'];

function flagOf(vitals: Vitals, key: Shown) {
  if (key !== 'bloodPressure') return vitalFlag(key, vitals[key]);
  return vitalFlag('systolic', vitals.systolic) ?? vitalFlag('diastolic', vitals.diastolic);
}

/** The nurse's measurements, read-only, with values outside the normal range flagged (FR-EMR-02, U8). */
export function VitalsGrid({ vitals, compact = false, className }: { vitals: Vitals; compact?: boolean; className?: string }) {
  const { t } = useTranslation(['encounters', 'triage']);
  const bodyMass = bmi(vitals);

  const value = (key: Shown) => (key === 'bloodPressure' ? bloodPressure(vitals) : vitals[key]);
  const unit = (key: Shown) => (key === 'bloodPressure' ? t('triage:units.systolic') : t(`triage:units.${key}`));
  const label = (key: Shown) => (key === 'bloodPressure' ? t('vitals.bloodPressure') : t(`triage:vitals.${key}`));

  return (
    <dl className={cn('grid gap-2', compact ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3', className)}>
      {SHOWN.map((key) => {
        const shown = value(key);
        const flag = flagOf(vitals, key);
        return (
          <div key={key} className={cn('rounded-lg border px-3 py-2', flag ? 'border-destructive/30 bg-destructive/10' : 'border-border bg-card')}>
            <dt className="text-caption text-muted-foreground">{label(key)}</dt>
            <dd className={cn('font-display tabular-nums', compact ? 'text-title-sm' : 'text-headline-md', flag ? 'text-destructive' : 'text-ink')}>
              {shown === undefined ? '—' : <bdi dir="ltr">{shown}</bdi>}
              {shown !== undefined && <span className="ms-1 text-caption font-normal text-muted-foreground">{unit(key)}</span>}
            </dd>
            {flag && <dd className="text-caption font-medium text-destructive">{t(`triage:flags.${flag}`)}</dd>}
            {key === 'weightKg' && bodyMass && !compact && (
              <dd className="text-caption text-muted-foreground">{t('vitals.bmi', { value: bodyMass })}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
