import { Footprints } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatWallClock } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { DoctorVisit } from '../model/doctor-day';
import { hasEncounter, VISIT_STATE_TONE, visitState } from '../model/rules';

/** The doctor's visits today in slot order, across branches (design doctor/01). */
export function DayList({ visits, nextId }: { visits: DoctorVisit[]; nextId?: string }) {
  const { t } = useTranslation('doctor');
  const { language } = useLanguage();
  const { serviceLabel, branchLabel } = useLookups();
  const branches = new Set(visits.map((v) => v.branchId));

  if (visits.length === 0) {
    return <EmptyState className="rounded-2xl border border-dashed border-border" title={t('day.emptyTitle')} description={t('day.emptyBody')} />;
  }

  return (
    <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {visits.map((visit) => {
        const state = visitState(visit);
        const next = visit.id === nextId;
        return (
          <li key={visit.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3', next && 'bg-secondary/60', (state === 'cancelled' || state === 'noShow') && 'opacity-60')}>
            <span className="w-20 shrink-0 text-label-md tabular-nums text-ink">{formatWallClock(visit.startTime, language)}</span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-title-sm text-ink">
                <bdi>{visit.patient.fullName}</bdi>
                {visit.source === 'WalkIn' && (
                  <StatusChip tone="highlight">
                    <Footprints aria-hidden="true" className="size-3" />
                    {t('day.walkIn')}
                  </StatusChip>
                )}
              </p>
              <p className="text-body-sm text-muted-foreground">
                <bdi dir="ltr">{visit.patient.mrn}</bdi> · {serviceLabel(visit.serviceId)}
                {branches.size > 1 && ` · ${branchLabel(visit.branchId)}`}
                {visit.queue && (
                  <>
                    {' · '}
                    {t('day.ticket')} <bdi dir="ltr">{visit.queue.ticketNo}</bdi>
                  </>
                )}
              </p>
            </div>
            <StatusChip tone={VISIT_STATE_TONE[state]}>{t(`state.${state}`)}</StatusChip>
            <div className="w-28 text-end">
              {hasEncounter(state) && (
                <Button asChild size="sm" variant={state === 'withDoctor' || state === 'unsigned' ? 'default' : 'ghost'}>
                  <Link to={`/doctor/encounters/${visit.id}`} aria-label={t('day.openFor', { name: visit.patient.fullName })}>
                    {state === 'unsigned' ? t('day.sign') : state === 'signed' ? t('day.viewNote') : t('day.open')}
                  </Link>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
