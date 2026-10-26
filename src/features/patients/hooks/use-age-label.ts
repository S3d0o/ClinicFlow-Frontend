import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ageParts } from '../model/patient';

/** "37 years" or "8 months" for a date of birth, as of the branch's `today`. */
export function useAgeLabel() {
  const { t } = useTranslation('patients');
  return useCallback(
    (dateOfBirth: string | undefined, today: string) => {
      if (!dateOfBirth) return '';
      const { unit, value } = ageParts(dateOfBirth, today);
      return unit === 'years' ? t('age.years', { count: value }) : t('age.months', { count: value });
    },
    [t]
  );
}
