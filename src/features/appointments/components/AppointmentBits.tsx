import { Navigation, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Branch } from '@/features/org/model/branch';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { directionsHref, telHref } from '@/shared/lib/places';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { AppointmentStatus } from '../model/appointment';
import { STATUS_TONE } from '../model/rules';

export function AppointmentStatusChip({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation('appointments');
  return <StatusChip tone={STATUS_TONE[status]}>{t(`status.${status}`)}</StatusChip>;
}

/** The calendar tile on appointment cards: weekday, day, month; navy when it's today. */
export function DateTile({ date, isToday }: { date: string; isToday?: boolean }) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex w-14 shrink-0 flex-col items-center rounded-xl border py-1.5 leading-tight',
        isToday ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-primary'
      )}
    >
      <span className="text-caption uppercase">{isToday ? t('dates.today') : formatDay(date, language, { weekday: 'short' })}</span>
      <span className="font-display text-headline-md">{formatDay(date, language, { day: 'numeric' })}</span>
      <span className="text-caption uppercase">{formatDay(date, language, { month: 'short' })}</span>
    </div>
  );
}

/** Call the branch and get directions there (UX_NOTES U1, U10). */
export function BranchActions({ branch, className }: { branch: Branch | undefined; className?: string }) {
  const { t } = useTranslation('appointments');
  const { language } = useLanguage();
  if (!branch) return null;
  const address = language === 'ar' ? branch.addressAr : branch.addressEn;
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      <Button asChild variant="outline" size="lg">
        <a href={telHref(branch.phone)} aria-label={`${t('actions.callBranch')} ${formatEgyptianPhone(branch.phone)}`}>
          <Phone aria-hidden="true" />
          {t('actions.callBranch')}
        </a>
      </Button>
      <Button asChild size="lg">
        <a href={directionsHref(address)} target="_blank" rel="noreferrer">
          <Navigation aria-hidden="true" />
          {t('actions.directions')}
        </a>
      </Button>
    </div>
  );
}
