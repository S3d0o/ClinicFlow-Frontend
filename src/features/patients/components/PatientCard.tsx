import type { ReactNode } from 'react';
import { CalendarDays, History, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatDay, formatMoney } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { StatusChip } from '@/shared/ui/StatusChip';
import { useAgeLabel } from '../hooks/use-age-label';
import type { PatientSummary } from '../model/patient';

interface PatientCardProps {
  patient: PatientSummary;
  today: string;
  /** Buttons for what the desk does next (book, walk-in, use this patient). */
  actions?: ReactNode;
  highlighted?: boolean;
  className?: string;
}

/** A patient record as the desk sees it in search results (design front-desk/02). */
export function PatientCard({ patient, today, actions, highlighted, className }: PatientCardProps) {
  const { t } = useTranslation('patients');
  const { language } = useLanguage();
  const ageLabel = useAgeLabel();
  const shortDate = (date: string) => formatDay(date, language, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <article className={cn('space-y-3 rounded-xl border bg-card p-4 shadow-card', highlighted ? 'border-primary ring-1 ring-primary' : 'border-border', className)}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-title-sm text-ink"><bdi>{patient.fullName}</bdi></h3>
          <p className="text-body-sm text-primary">
            <bdi dir="ltr">{patient.mrn}</bdi>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {patient.hasPortalAccount && <StatusChip tone="success">{t('card.portal')}</StatusChip>}
          {patient.balanceDue > 0 && <StatusChip tone="warning">{t('card.balance', { amount: formatMoney(patient.balanceDue, language) })}</StatusChip>}
        </div>
      </header>

      <dl className="grid gap-x-4 gap-y-1.5 text-body-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <dt className="sr-only">{t('card.phone')}</dt>
          <Phone aria-hidden="true" className="size-4 text-muted-foreground" />
          <dd>
            <bdi dir="ltr">{formatEgyptianPhone(patient.phone)}</bdi>
          </dd>
        </div>
        {patient.dateOfBirth && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">{t('card.born')}</dt>
            <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
            <dd>
              {shortDate(patient.dateOfBirth)} ({ageLabel(patient.dateOfBirth, today)})
            </dd>
          </div>
        )}
        {patient.nationalId && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">{t('card.nationalId')}</dt>
            <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />
            <dd>
              <Trans t={t} i18nKey="card.nationalIdValue" values={{ id: patient.nationalId }} components={{ num: <bdi dir="ltr" /> }} />
            </dd>
          </div>
        )}
        {patient.insurance && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">{t('card.insurance')}</dt>
            <ShieldCheck aria-hidden="true" className="size-4 text-muted-foreground" />
            <dd>{patient.insurance.payerName}</dd>
          </div>
        )}
        <div className="flex items-center gap-2 sm:col-span-2">
          <dt className="sr-only">{t('card.lastVisit')}</dt>
          <History aria-hidden="true" className="size-4 text-muted-foreground" />
          <dd className="text-muted-foreground">
            {patient.lastVisit
              ? t('card.lastVisitValue', { date: shortDate(patient.lastVisit.date), doctor: patient.lastVisit.doctorName })
              : t('card.noVisits')}
          </dd>
        </div>
      </dl>

      {actions && <footer className="flex flex-wrap gap-2 border-t border-border pt-3">{actions}</footer>}
    </article>
  );
}
