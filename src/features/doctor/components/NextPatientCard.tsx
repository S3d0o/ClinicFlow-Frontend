import { ArrowRight, Footprints, Megaphone, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { AllergyChips } from '@/features/encounters/components/AllergyChips';
import { VitalsGrid } from '@/features/encounters/components/VitalsGrid';
import { useAgeLabel } from '@/features/patients/hooks/use-age-label';
import { TicketBadge } from '@/features/queue/components/TicketBadge';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatInstant } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { DoctorVisit } from '../model/doctor-day';

interface NextPatientCardProps {
  visit: DoctorVisit;
  /** The patient being seen now, if any: one patient in the room at a time. */
  inRoom?: DoctorVisit;
  now: Date;
  today: string;
  timeZone: string;
  calling: boolean;
  onCall: (visit: DoctorVisit) => void;
}

/** Who to call next (design doctor/01): the complaint, the nurse's vitals and the allergies before the patient walks in. */
export function NextPatientCard({ visit, inRoom, now, today, timeZone, calling, onCall }: NextPatientCardProps) {
  const { t } = useTranslation('doctor');
  const { language } = useLanguage();
  const { serviceLabel } = useLookups();
  const ageLabel = useAgeLabel();
  const room = visit.room ? nameIn(visit.room, language) : undefined;
  const triagedMinutes = visit.triage ? Math.max(0, Math.floor((now.getTime() - Date.parse(visit.triage.recordedAt)) / 60_000)) : undefined;

  return (
    <section aria-labelledby="next-patient" className="space-y-4 rounded-2xl border-2 border-ink bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-label-sm uppercase text-ink-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-highlight" />
          {room ? t('next.labelRoom', { room }) : t('next.label')}
        </span>
        {visit.triage && (
          <span className="text-body-sm text-muted-foreground">
            {t('next.triaged', { minutes: triagedMinutes, nurse: visit.triage.recordedByName })}
          </span>
        )}
        {visit.queue && <TicketBadge ticket={visit.queue.ticketNo} className="ms-auto" />}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="next-patient" className="font-display text-headline-lg text-ink"><bdi>{visit.patient.fullName}</bdi></h2>
            {visit.source === 'WalkIn' && (
              <StatusChip tone="highlight">
                <Footprints aria-hidden="true" className="size-3" />
                {t('day.walkIn')}
              </StatusChip>
            )}
          </div>
          <p className="text-body-md text-muted-foreground">
            {[ageLabel(visit.patient.dateOfBirth, today), serviceLabel(visit.serviceId)].filter(Boolean).join(' · ')} ·{' '}
            <bdi dir="ltr">{visit.patient.mrn}</bdi>
          </p>
          {visit.triage?.form.chiefComplaint && (
            <div className="rounded-xl border border-border bg-secondary/50 p-3">
              <p className="text-label-sm uppercase text-muted-foreground">{t('next.complaint')}</p>
              <p dir="auto" className="text-body-lg text-foreground">{visit.triage.form.chiefComplaint}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <AllergyChips allergies={visit.allergies} />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-label-md text-ink">
            <Stethoscope aria-hidden="true" className="size-4 text-primary" />
            {visit.triage
              ? t('next.vitals', { time: formatInstant(visit.triage.recordedAt, language, timeZone, { hour: 'numeric', minute: '2-digit' }) })
              : t('next.noVitals')}
          </h3>
          {visit.triage && <VitalsGrid vitals={visit.triage.form} compact className="sm:grid-cols-3" />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {inRoom && (
          <p role="status" className="text-body-sm text-warning">
            {t('next.busy', { name: inRoom.patient.fullName })}
          </p>
        )}
        <div className="ms-auto flex flex-wrap gap-2">
          {inRoom && (
            <Button asChild variant="outline">
              <Link to={`/doctor/encounters/${inRoom.id}`}>
                {t('next.backToRoom')}
                <ArrowRight aria-hidden="true" className="rtl-flip" />
              </Link>
            </Button>
          )}
          <Button size="lg" variant="strong" disabled={!!inRoom || calling} onClick={() => onCall(visit)}>
            <Megaphone aria-hidden="true" className="rtl-flip" />
            {room ? t('next.callTo', { room }) : t('next.call')}
          </Button>
        </div>
      </div>
    </section>
  );
}
