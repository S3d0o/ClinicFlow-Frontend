import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { addDays, todayIn } from '@/shared/lib/branch-time';
import { formatDay } from '@/shared/lib/intl';

/** "Today", "Tomorrow" or "Sat, Oct 31" for a branch-local date, judged in the branch's zone. */
export function useDayLabel() {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  return useCallback(
    (date: string, timeZone = 'Africa/Cairo') => {
      const today = todayIn(timeZone);
      if (date === today) return t('dates.today');
      if (date === addDays(today, 1)) return t('dates.tomorrow');
      return formatDay(date, language);
    },
    [t, language]
  );
}
