import { useState } from 'react';
import { ArrowRight, CalendarDays, FlaskConical, Info, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { RecordsTabs } from '@/features/records/components/RecordsTabs';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay, formatInstant } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { useMyVisits } from '../hooks/use-visits';

/** "My visits" (design patient/13): published visit summaries, filterable by branch (FR-PAT-05). */
export default function VisitsPage() {
  const { t } = useTranslation(['records', 'screens']);
  const { language } = useLanguage();
  const visits = useMyVisits();
  const { branch, branchLabel, specialtyLabel } = useLookups();
  const [branchId, setBranchId] = useState<string | null>(null);

  const branchIds = [...new Set((visits.data ?? []).map((v) => v.branchId))];
  const shown = (visits.data ?? []).filter((v) => !branchId || v.branchId === branchId);

  return (
    <div className="space-y-5">
      <RecordsTabs />
      <PageHeader title={t('screens:visits')} description={t('visits.intro')} />

      {visits.isPending ? (
        <LoadingState />
      ) : visits.isError ? (
        <ErrorState onRetry={() => void visits.refetch()} />
      ) : visits.data.length === 0 ? (
        <EmptyState className="rounded-2xl border border-dashed border-border" title={t('visits.empty')} />
      ) : (
        <>
          {branchIds.length > 1 && (
            <div role="group" aria-label={t('visits.allBranches')} className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {[null, ...branchIds].map((id) => (
                <button
                  key={id ?? 'all'}
                  type="button"
                  aria-pressed={branchId === id}
                  onClick={() => setBranchId(id)}
                  className={cn(
                    'min-h-10 shrink-0 rounded-full border px-4 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    branchId === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'
                  )}
                >
                  {id ? branchLabel(id) : `${t('visits.allBranches')} (${visits.data.length})`}
                </button>
              ))}
            </div>
          )}
          <ul className="space-y-4">
            {shown.map((visit) => {
              const timeZone = branch(visit.branchId)?.timeZone ?? 'Africa/Cairo';
              return (
                <li key={visit.id} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-3 text-body-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
                      {formatInstant(visit.startsAtUtc, language, timeZone, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-caption text-primary">{branchLabel(visit.branchId)}</span>
                  </div>
                  <div>
                    <h2 className="font-display text-title-sm text-ink">{visit.doctorName}</h2>
                    <p className="text-body-sm text-primary">{specialtyLabel(visit.specialtyId)}</p>
                  </div>
                  {visit.diagnoses.map((diagnosis) => (
                    <p key={diagnosis} dir="auto" className="w-fit rounded-lg bg-muted px-3 py-1 text-start text-label-md text-foreground">
                      {diagnosis}
                    </p>
                  ))}
                  <ul className="space-y-1 text-body-sm text-muted-foreground">
                    {visit.prescriptionCount > 0 && (
                      <li className="flex items-center gap-2">
                        <Pill aria-hidden="true" className="size-4" />
                        {t('visits.medicines', { count: visit.prescriptionCount })}
                      </li>
                    )}
                    {visit.orderCount > 0 && (
                      <li className="flex items-center gap-2">
                        <FlaskConical aria-hidden="true" className="size-4" />
                        {t('visits.tests', { count: visit.orderCount })}
                      </li>
                    )}
                    {visit.followUp && (
                      <li className="flex items-center gap-2">
                        <CalendarDays aria-hidden="true" className="size-4" />
                        {t('visits.followUp', {
                          from: formatDay(visit.followUp.from, language, { day: 'numeric', month: 'short' }),
                          to: formatDay(visit.followUp.to, language, { day: 'numeric', month: 'short' }),
                        })}
                      </li>
                    )}
                  </ul>
                  <Link to={`/patient/visits/${visit.id}`} className="flex items-center justify-end gap-1 border-t border-border pt-3 text-label-md text-primary hover:underline">
                    {t('visits.viewSummary')}
                    <ArrowRight aria-hidden="true" className="rtl-flip size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="flex items-start gap-2 rounded-xl border border-info/25 bg-info/10 p-3 text-body-sm text-info">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {t('visits.reportNote')}
      </p>
    </div>
  );
}
