import { useState, type ReactNode } from 'react';
import { ArrowLeft, Download, FileText, HeartPulse, Pill, Scale, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AllergyChips } from '@/features/encounters/components/AllergyChips';
import { dosageText } from '@/features/encounters/model/rules';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { branchName } from '@/features/org/model/branch-access';
import { useAgeLabel } from '@/features/patients/hooks/use-age-label';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { formatDay, formatFileSize, formatInstant, formatNumber } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { BloodPressureChart } from '../components/BloodPressureChart';
import { HistoryEncounterCard } from '../components/HistoryEncounterCard';
import { useDownloadHistory, usePatientHistory } from '../hooks/use-history';
import { trend, type HistoryFilter, type HistoryPeriod, type VitalsPoint } from '../model/history';

const PERIODS: HistoryPeriod[] = ['12m', '24m', 'all'];

function Card({ icon, title, aside, children, className }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-title-sm text-ink">
          <span aria-hidden="true" className="text-primary">{icon}</span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** The latest value of one measure and how it moved over the period. */
function TrendTile({ icon, label, unit, points, measure }: { icon: ReactNode; label: string; unit: string; points: VitalsPoint[]; measure: 'pulse' | 'weightKg' }) {
  const { t } = useTranslation('history');
  const { language } = useLanguage();
  const latest = [...points].reverse().find((p) => p[measure] !== undefined)?.[measure];
  const change = trend(points, measure);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
      <div>
        <p className="text-label-md text-muted-foreground">{label}</p>
        <p className="font-display text-headline-md tabular-nums text-ink">
          {latest !== undefined ? formatNumber(latest, language) : '—'}
          {latest !== undefined && <span className="ms-1 text-body-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        {change !== undefined && (
          <p className="text-body-sm text-muted-foreground">
            {t('vitals.change', { value: `${change > 0 ? '+' : ''}${formatNumber(change, language)}`, unit })}
          </p>
        )}
      </div>
    </div>
  );
}

/** A patient's history across branches (design doctor/03, FR-EMR-12): vitals trends, the visit timeline, medicines, files. */
export default function PatientHistoryPage() {
  const { patientId = '' } = useParams();
  const { t } = useTranslation(['history', 'patients', 'triage']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { activeBranch, branches } = useActiveBranch();
  const { today, timeZone } = useBranchClock(activeBranch);
  const ageLabel = useAgeLabel();
  const [filter, setFilter] = useState<HistoryFilter>({ period: '12m' });
  const history = usePatientHistory(patientId, filter);
  const download = useDownloadHistory();

  const back = (
    <Button asChild variant="link" className="px-0">
      <Link to="/doctor/patients">
        <ArrowLeft aria-hidden="true" className="rtl-flip" />
        {t('back')}
      </Link>
    </Button>
  );

  if (history.isPending) return <div className="space-y-4">{back}<LoadingState /></div>;
  if (history.isError) return <div className="space-y-4">{back}<ErrorState description={errorMessage(history.error)} onRetry={() => void history.refetch()} /></div>;

  const { patient, vitals, encounters, prescriptions, documents } = history.data;
  const active = prescriptions.filter((p) => p.active);

  const exportSummary = () =>
    download.mutate(
      { patientId, fileName: `${patient.mrn}-summary.pdf` },
      { onError: (error) => toast.error(errorMessage(error)) }
    );

  return (
    <div className={cn('space-y-6', history.isPlaceholderData && 'opacity-70')}>
      {back}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={patient.fullName} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-headline-lg text-ink"><bdi>{patient.fullName}</bdi></h1>
              {patient.bloodType && <StatusChip tone="danger">{t('history:patient.bloodType', { type: patient.bloodType })}</StatusChip>}
            </div>
            <p className="text-body-md text-muted-foreground">
              {[ageLabel(patient.dateOfBirth, today), patient.gender && t(`patients:register.genders.${patient.gender}`)].filter(Boolean).join(' · ')} ·{' '}
              <bdi dir="ltr">{patient.mrn}</bdi> · <bdi dir="ltr">{formatEgyptianPhone(patient.phone)}</bdi>
              {patient.nationalId && (
                <>
                  {' · '}
                  {t('history:patient.nationalId')} <bdi dir="ltr">{patient.nationalId}</bdi>
                </>
              )}
            </p>
            {patient.insurance && (
              <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                {t('history:patient.insurance', { payer: patient.insurance.payerName })} · <bdi dir="ltr">{patient.insurance.memberNo}</bdi> ·{' '}
                {t(`history:patient.policy.${patient.insurance.status}`)}
              </p>
            )}
          </div>
          <Button variant="strong" onClick={exportSummary} disabled={download.isPending}>
            <Download aria-hidden="true" />
            {t('history:export')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
          <AllergyChips allergies={patient.allergies} />
          {patient.conditions.map((condition) => (
            <StatusChip key={condition} tone="info"><span dir="auto">{condition}</span></StatusChip>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between">
          {branches.length > 1 && (
            <FilterChips
              label={t('history:filters.branch')}
              options={[{ value: undefined, label: t('history:filters.allBranches') }, ...branches.map((b) => ({ value: b.id, label: branchName(b, language) }))]}
              value={filter.branchId}
              onChange={(branchId) => setFilter((current) => ({ ...current, branchId }))}
            />
          )}
          <FilterChips
            label={t('history:filters.period')}
            options={PERIODS.map((period) => ({ value: period, label: t(`history:filters.periods.${period}`) }))}
            value={filter.period}
            onChange={(period) => setFilter((current) => ({ ...current, period }))}
          />
        </div>
      </section>

      <Card icon={<HeartPulse className="size-5" />} title={t('history:vitals.title')} aside={<span className="text-caption text-muted-foreground">{t('history:vitals.count', { count: vitals.length })}</span>}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <BloodPressureChart points={vitals} timeZone={timeZone} />
          <div className="space-y-3">
            <TrendTile icon={<HeartPulse className="size-5" />} label={t('triage:vitals.pulse')} unit={t('triage:units.pulse')} points={vitals} measure="pulse" />
            <TrendTile icon={<Scale className="size-5" />} label={t('triage:vitals.weightKg')} unit={t('triage:units.weightKg')} points={vitals} measure="weightKg" />
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="timeline-heading" className="space-y-3">
          <h2 id="timeline-heading" className="font-display text-headline-md text-ink">{t('history:timeline.title', { count: encounters.length })}</h2>
          {encounters.length === 0 ? (
            <EmptyState className="rounded-2xl border border-dashed border-border" title={t('history:timeline.emptyTitle')} description={t('history:timeline.emptyBody')} />
          ) : (
            <ol className="space-y-3 border-s-2 border-border ps-4">
              {encounters.map((encounter) => (
                <li key={encounter.appointmentId} className="relative">
                  <span aria-hidden="true" className={cn('absolute -start-[1.4rem] top-5 size-3 rounded-full border-2 border-card', encounter.inProgress ? 'bg-primary' : 'bg-border')} />
                  <HistoryEncounterCard encounter={encounter} today={today} canOpen={encounter.byMe} />
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside className="space-y-4">
          <Card icon={<Pill className="size-5" />} title={t('history:medicines.title')} aside={<span className="text-caption text-muted-foreground">{t('history:medicines.active', { count: active.length })}</span>}>
            {prescriptions.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">{t('history:medicines.none')}</p>
            ) : (
              <ul className="space-y-2">
                {[...active, ...prescriptions.filter((p) => !p.active)].map((item) => (
                  <li key={`${item.startedOn}-${item.id}`} className={cn('space-y-1 rounded-xl border border-border p-3', !item.active && 'opacity-70')}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-label-md text-ink"><bdi>{item.drugName}{item.strength && ` ${item.strength}`}</bdi></p>
                      <StatusChip tone={item.active ? 'success' : 'neutral'}>{item.active ? t('history:medicines.current') : t('history:medicines.finished')}</StatusChip>
                    </div>
                    <p dir="auto" className="text-body-sm">{dosageText(item)}</p>
                    <p className="text-caption text-muted-foreground">
                      {t('history:medicines.started', { date: formatDay(item.startedOn, language, { day: 'numeric', month: 'short', year: 'numeric' }), doctor: item.doctorName })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card icon={<FileText className="size-5" />} title={t('history:documents.title')}>
            {documents.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">{t('history:documents.none')}</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="rounded-xl border border-border p-3">
                    <p dir="auto" className="truncate text-label-md text-ink">{doc.fileName}</p>
                    <p className="text-caption text-muted-foreground">
                      {formatInstant(doc.uploadedAt, language, timeZone, { day: 'numeric', month: 'short', year: 'numeric' })} · {formatFileSize(doc.sizeBytes, language)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
