import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { dosageText } from '@/features/encounters/model/rules';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatDay } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { HistoryEncounter } from '../model/history';

/** One visit on the timeline: who, where, what was found and prescribed. */
export function HistoryEncounterCard({ encounter, today, canOpen }: { encounter: HistoryEncounter; today: string; canOpen: boolean }) {
  const { t } = useTranslation('history');
  const { language } = useLanguage();
  const { branchLabel, specialtyLabel } = useLookups();
  const dateLabel = encounter.date === today ? t('timeline.today') : formatDay(encounter.date, language, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <article className={cn('space-y-3 rounded-2xl border bg-card p-4 shadow-card', encounter.inProgress ? 'border-primary' : 'border-border')}>
      <header className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-title-sm text-ink">{dateLabel}</h3>
          <p className="text-body-sm text-muted-foreground">
            {encounter.doctorName} · {specialtyLabel(encounter.specialtyId)} · {branchLabel(encounter.branchId)}
          </p>
        </div>
        {encounter.inProgress ? (
          <StatusChip tone="primary">{t('timeline.inProgress')}</StatusChip>
        ) : encounter.status === 'Draft' ? (
          <StatusChip tone="warning">{t('timeline.unsigned')}</StatusChip>
        ) : (
          encounter.addendaCount > 0 && <StatusChip tone="info">{t('timeline.addenda', { count: encounter.addendaCount })}</StatusChip>
        )}
      </header>
      {encounter.chiefComplaint && (
        <p className="text-body-md"><span className="me-2 text-label-md text-muted-foreground">{t('timeline.complaint')}</span><span dir="auto">{encounter.chiefComplaint}</span></p>
      )}
      {encounter.assessment && (
        <p className="text-body-md"><span className="me-2 text-label-md text-muted-foreground">{t('timeline.assessment')}</span><span dir="auto">{encounter.assessment}</span></p>
      )}
      {encounter.plan && (
        <p className="text-body-md"><span className="me-2 text-label-md text-muted-foreground">{t('timeline.plan')}</span><span dir="auto">{encounter.plan}</span></p>
      )}
      {encounter.diagnoses.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('timeline.diagnoses')}>
          {encounter.diagnoses.map((d) => (
            <li key={d.id} className="rounded-full bg-secondary px-2.5 py-0.5 text-label-sm text-secondary-foreground">
              <bdi dir="ltr">{d.code} · {d.title}</bdi>
            </li>
          ))}
        </ul>
      )}
      {encounter.prescriptions.length > 0 && (
        <ul className="space-y-0.5 text-body-sm" aria-label={t('timeline.prescriptions')}>
          {encounter.prescriptions.map((item) => (
            <li key={item.id}>
              <bdi className="font-medium">{item.drugName}{item.strength && ` ${item.strength}`}</bdi> · <bdi>{dosageText(item)}</bdi>
            </li>
          ))}
        </ul>
      )}
      {encounter.orders.length > 0 && (
        <p className="text-body-sm text-muted-foreground">
          {t('timeline.orders')}: {encounter.orders.map((o) => o.description).join(' · ')}
        </p>
      )}
      {canOpen && (
        <Button asChild variant="link" size="sm" className="px-0">
          <Link to={`/doctor/encounters/${encounter.appointmentId}`}>
            {t('timeline.open')}
            <ArrowRight aria-hidden="true" className="rtl-flip" />
          </Link>
        </Button>
      )}
    </article>
  );
}
