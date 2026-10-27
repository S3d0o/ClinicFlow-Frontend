import type { ReactNode } from 'react';
import { History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useAgeLabel } from '@/features/patients/hooks/use-age-label';
import { TicketBadge } from '@/features/queue/components/TicketBadge';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatInstant } from '@/shared/lib/intl';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { Encounter } from '../model/encounter';
import { AllergyChips } from './AllergyChips';
import { VitalsGrid } from './VitalsGrid';

interface EncounterHeaderProps {
  encounter: Encounter;
  now: Date;
  today: string;
  timeZone: string;
  /** e.g. the "Call to room" button while the patient is still waiting. */
  actions?: ReactNode;
}

/** Who the doctor is seeing (design doctor/02): identity, visit, allergies, conditions and the nurse's vitals. */
export function EncounterHeader({ encounter, now, today, timeZone, actions }: EncounterHeaderProps) {
  const { t } = useTranslation(['encounters', 'patients', 'queue']);
  const { language } = useLanguage();
  const { serviceLabel } = useLookups();
  const ageLabel = useAgeLabel();
  const { patient, visit, triage } = encounter;
  const time = (iso: string) => formatInstant(iso, language, timeZone, { hour: 'numeric', minute: '2-digit' });
  const waited = visit.checkedInAt && visit.calledAt ? Math.max(0, Math.round((Date.parse(visit.calledAt) - Date.parse(visit.checkedInAt)) / 60_000)) : undefined;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={patient.fullName} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-headline-lg text-ink"><bdi>{patient.fullName}</bdi></h1>
            <StatusChip tone={encounter.status === 'Signed' ? 'success' : 'warning'}>{t(`status.${encounter.status}`)}</StatusChip>
          </div>
          <p className="text-body-md text-muted-foreground">
            {[ageLabel(patient.dateOfBirth, today), patient.gender && t(`patients:register.genders.${patient.gender}`), patient.bloodType && t('header.bloodType', { type: patient.bloodType })]
              .filter(Boolean)
              .join(' · ')}{' '}
            · <bdi dir="ltr">{patient.mrn}</bdi>
          </p>
          <p className="text-body-sm text-muted-foreground">
            {serviceLabel(visit.serviceId)}
            {visit.room && ` · ${nameIn(visit.room, language)}`}
            {visit.checkedInAt && ` · ${t('header.checkedIn', { time: time(visit.checkedInAt) })}`}
            {waited !== undefined && ` · ${t('header.waited', { count: waited })}`}
            {visit.stage && visit.status === 'CheckedIn' && ` · ${t(`queue:stage.${visit.stage}`)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {visit.ticketNo && <TicketBadge ticket={visit.ticketNo} size="lg" />}
          <Button asChild variant="outline">
            <Link to={`/doctor/patients/${patient.id}`}>
              <History aria-hidden="true" />
              {t('header.history')}
            </Link>
          </Button>
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
        <AllergyChips allergies={patient.allergies} />
        {patient.conditions.map((condition) => (
          <StatusChip key={condition} tone="info"><span dir="auto">{condition}</span></StatusChip>
        ))}
      </div>

      {triage ? (
        <div className="space-y-2">
          <p className="text-body-sm text-muted-foreground">
            {t('header.vitals', { nurse: triage.recordedByName, time: time(triage.recordedAt), minutes: Math.max(0, Math.floor((now.getTime() - Date.parse(triage.recordedAt)) / 60_000)) })}
          </p>
          <VitalsGrid vitals={triage.form} compact />
          {triage.form.chiefComplaint && (
            <p className="rounded-lg bg-secondary/50 px-3 py-2 text-body-md">
              <span className="me-2 text-label-md text-muted-foreground">{t('header.complaint')}</span>
              <span dir="auto">{triage.form.chiefComplaint}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-body-sm text-muted-foreground">{t('header.noVitals')}</p>
      )}
    </section>
  );
}
