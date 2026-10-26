import type { ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { Avatar } from '@/shared/ui/Avatar';
import { useAgeLabel } from '../hooks/use-age-label';
import type { PatientSummary } from '../model/patient';

/** The patient a desk action is for, in one line (design front-desk/03 header). */
export function PatientBanner({ patient, today, action }: { patient: PatientSummary; today: string; action?: ReactNode }) {
  const { t } = useTranslation('patients');
  const { language } = useLanguage();
  const ageLabel = useAgeLabel();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      <Avatar name={patient.fullName} size="lg" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-headline-md text-ink"><bdi>{patient.fullName}</bdi></p>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-label-sm text-secondary-foreground">
            <bdi dir="ltr">{patient.mrn}</bdi>
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Phone aria-hidden="true" className="size-3.5" />
            <bdi dir="ltr">{formatEgyptianPhone(patient.phone)}</bdi>
          </span>
          {patient.dateOfBirth && <span>{ageLabel(patient.dateOfBirth, today)}</span>}
          {patient.gender && <span>{t(`register.genders.${patient.gender}`)}</span>}
          <span>
            {patient.lastVisit
              ? t('card.lastVisitValue', {
                  date: formatDay(patient.lastVisit.date, language, { day: 'numeric', month: 'short', year: 'numeric' }),
                  doctor: patient.lastVisit.doctorName,
                })
              : t('card.noVisits')}
          </span>
        </p>
      </div>
      {action}
    </div>
  );
}
