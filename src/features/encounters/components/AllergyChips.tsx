import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Allergy } from '@/features/profile/model/profile';
import { StatusChip } from '@/shared/ui/StatusChip';

/** The patient's allergies, always in sight on the doctor's screens (FR-EMR-05); "none recorded" when empty. */
export function AllergyChips({ allergies }: { allergies: Allergy[] }) {
  const { t } = useTranslation('triage');
  if (allergies.length === 0) return <StatusChip tone="neutral">{t('form.noAllergies')}</StatusChip>;
  return (
    <>
      {allergies.map((allergy) => (
        <StatusChip key={allergy.name} tone="danger">
          <AlertTriangle aria-hidden="true" className="size-3" />
          {allergy.severity
            ? t('form.allergySeverity', { name: allergy.name, severity: t(`form.severity.${allergy.severity}`) })
            : t('form.allergy', { name: allergy.name })}
        </StatusChip>
      ))}
    </>
  );
}
