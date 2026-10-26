import { useState } from 'react';
import { AlertTriangle, ArrowRight, Clock, Footprints, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { BranchRequired } from '@/features/org/components/BranchRequired';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import type { Branch } from '@/features/org/model/branch';
import { useAgeLabel } from '@/features/patients/hooks/use-age-label';
import { normalizeName } from '@/features/patients/model/search';
import { TicketBadge } from '@/features/queue/components/TicketBadge';
import { useQueueBoard, useQueueLive } from '@/features/queue/hooks/use-queue';
import { boardColumns, filterByDoctor, minutesInStage, queueDoctors, type QueueEntry } from '@/features/queue/model/queue';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatInstant } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { RoomsPanel } from '../components/RoomsPanel';

function TriageItem({ entry, next, now, today, timeZone }: { entry: QueueEntry; next: boolean; now: Date; today: string; timeZone: string }) {
  const { t } = useTranslation(['triage', 'patients']);
  const { language } = useLanguage();
  const { specialtyLabel } = useLookups();
  const ageLabel = useAgeLabel();
  const details = [ageLabel(entry.dateOfBirth, today), entry.gender && t(`patients:register.genders.${entry.gender}`)].filter(Boolean).join(' · ');

  return (
    <article className={cn('relative rounded-2xl border bg-card p-4 shadow-card sm:p-5', next ? 'border-2 border-ink' : 'border-border')}>
      {next && (
        <span className="absolute -top-3 start-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-0.5 text-label-sm uppercase text-ink-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-highlight" />
          {t('queue.nextInLine')}
        </span>
      )}
      <div className="flex flex-wrap items-start gap-4">
        <TicketBadge ticket={entry.ticketNo} size="lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-title-sm text-ink"><bdi>{entry.patientName}</bdi></h2>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-label-sm text-secondary-foreground"><bdi dir="ltr">{entry.mrn}</bdi></span>
            {entry.source === 'WalkIn' && (
              <StatusChip tone="highlight">
                <Footprints aria-hidden="true" className="size-3" />
                {t('queue.walkIn')}
              </StatusChip>
            )}
          </div>
          <p className="text-body-sm text-muted-foreground">
            {details && `${details} · `}
            {entry.doctorName} · {specialtyLabel(entry.specialtyId)}
            {entry.room && ` (${nameIn(entry.room, language)})`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {entry.allergies.map((allergy) => (
              <StatusChip key={allergy.name} tone="danger">
                <AlertTriangle aria-hidden="true" className="size-3" />
                {t('queue.allergy', { name: allergy.name })}
              </StatusChip>
            ))}
            <StatusChip tone={minutesInStage(entry, now) >= 30 ? 'warning' : 'neutral'}>
              <Clock aria-hidden="true" className="size-3" />
              {t('queue.checkedIn', { time: formatInstant(entry.checkedInAt, language, timeZone, { hour: 'numeric', minute: '2-digit' }), minutes: minutesInStage(entry, now) })}
            </StatusChip>
          </div>
          {entry.complaint && <p dir="auto" className="rounded-lg bg-muted px-2 py-1.5 text-body-sm">{entry.complaint}</p>}
          {entry.priorityReason && <p dir="auto" className="text-body-sm text-highlight-strong">{t('queue.priority', { reason: entry.priorityReason })}</p>}
        </div>
        <Button asChild size={next ? 'lg' : 'default'} variant={next ? 'strong' : 'outline'} className="min-h-12">
          <Link to={`/nurse/triage/${entry.appointmentId}`} aria-label={t('queue.startFor', { name: entry.patientName })}>
            {t('queue.start')}
            <ArrowRight aria-hidden="true" className="rtl-flip" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function NurseQueue({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['triage', 'screens']);
  const { now, today, timeZone } = useBranchClock(branch);
  const board = useQueueBoard(branch.id);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  useQueueLive(branch.id);

  const entries = board.data ?? [];
  const [waiting] = boardColumns(filterByDoctor(entries, doctorId));
  const q = normalizeName(search);
  const shown = q ? waiting.entries.filter((e) => normalizeName(`${e.ticketNo} ${e.patientName}`).includes(q)) : waiting.entries;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="triage-heading" className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="triage-heading" className="font-display text-headline-lg text-ink">{t('screens:nurseQueue')}</h1>
            <p className="text-body-md text-muted-foreground">{t('queue.waiting', { count: waiting.entries.length })}</p>
          </div>
        </header>
        {board.isPending ? (
          <LoadingState />
        ) : board.isError ? (
          <ErrorState onRetry={() => void board.refetch()} />
        ) : (
          <>
            <FilterChips
              label={t('queue.filterLabel')}
              options={[{ value: null, label: t('queue.allDoctors') }, ...queueDoctors(entries).map((d) => ({ value: d.id, label: d.name }))]}
              value={doctorId}
              onChange={setDoctorId}
            />
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t('queue.search')}
                placeholder={t('queue.search')}
                className="h-12 w-full rounded-xl border border-input bg-card ps-12 pe-4 text-body-lg outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              />
            </div>
            {shown.length === 0 ? (
              <EmptyState className="rounded-2xl border border-dashed border-border" title={t('queue.emptyTitle')} description={t('queue.emptyBody')} />
            ) : (
              <ol className="space-y-4 pt-2">
                {shown.map((entry, index) => (
                  <li key={entry.appointmentId}>
                    <TriageItem entry={entry} next={index === 0 && !q} now={now} today={today} timeZone={timeZone} />
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </section>
      <RoomsPanel entries={entries} now={now} />
    </div>
  );
}

/** The nurse's triage queue on the tablet (design nurse/01): who is next for vitals, and the rooms. */
export default function NurseQueuePage() {
  return <BranchRequired>{(branch) => <NurseQueue branch={branch} />}</BranchRequired>;
}
