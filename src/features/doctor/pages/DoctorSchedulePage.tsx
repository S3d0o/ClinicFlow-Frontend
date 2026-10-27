import { useState } from 'react';
import { CalendarDays, CalendarOff, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { addDays } from '@/shared/lib/branch-time';
import { formatDay, formatNumber } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatTile } from '@/shared/ui/StatTile';
import { LeaveForm } from '../components/LeaveForm';
import { LeaveList } from '../components/LeaveList';
import { ShiftCard } from '../components/ShiftCard';
import { useDoctorWeek } from '../hooks/use-doctor';
import { weekStartOf } from '../model/rules';

/** The doctor's week (design doctor/04, FR-SCH-01): shifts at every branch with booked slots, and leave (FR-SCH-06). */
export default function DoctorSchedulePage() {
  const { t } = useTranslation(['doctor', 'screens']);
  const { language } = useLanguage();
  const { activeBranch } = useActiveBranch();
  const { today } = useBranchClock(activeBranch);
  const thisWeek = weekStartOf(today);
  const [weekStart, setWeekStart] = useState(thisWeek);
  const week = useDoctorWeek(weekStart);
  const short = (date: string) => formatDay(date, language, { day: 'numeric', month: 'short' });

  const shifts = week.data?.days.flatMap((d) => d.shifts) ?? [];
  const working = shifts.filter((s) => !s.onLeave);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('screens:doctorSchedule')}
        description={t('week.range', { from: short(weekStart), to: short(addDays(weekStart, 6)) })}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label={t('week.previous')}>
              <ChevronLeft aria-hidden="true" className="rtl-flip" />
            </Button>
            <Button variant="outline" onClick={() => setWeekStart(thisWeek)} disabled={weekStart === thisWeek}>{t('week.thisWeek')}</Button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label={t('week.next')}>
              <ChevronRight aria-hidden="true" className="rtl-flip" />
            </Button>
          </div>
        }
      />

      {week.isPending ? (
        <LoadingState />
      ) : week.isError ? (
        <ErrorState onRetry={() => void week.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label={t('week.hours')} value={formatNumber(Math.round((week.data.minutes / 60) * 10) / 10, language)} icon={<Clock className="size-5" />} />
            <StatTile label={t('week.shifts')} value={working.length} hint={t('week.branches', { count: new Set(working.map((s) => s.branchId)).size })} icon={<CalendarDays className="size-5" />} />
            <StatTile
              label={t('week.booked')}
              value={working.reduce((sum, s) => sum + s.slotsBooked, 0)}
              hint={t('week.ofSlots', { count: working.reduce((sum, s) => sum + s.slotsTotal, 0) })}
              icon={<Users className="size-5" />}
            />
            <StatTile label={t('week.onLeave')} value={shifts.length - working.length} hint={t('week.onLeaveHint')} icon={<CalendarOff className="size-5" />} />
          </div>

          <section aria-labelledby="roster-heading" className="space-y-3">
            <h2 id="roster-heading" className="font-display text-headline-md text-ink">{t('week.roster')}</h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
              {week.data.days.map((day) => (
                <li key={day.date} className={cn('space-y-2 rounded-2xl border p-3', day.date === today ? 'border-primary bg-secondary/40' : 'border-border bg-card')}>
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="text-label-md uppercase text-muted-foreground">{formatDay(day.date, language, { weekday: 'short' })}</span>
                    <span className="font-display text-title-sm text-ink">{short(day.date)}</span>
                  </p>
                  {day.date === today && <p className="text-label-sm uppercase text-primary">{t('week.today')}</p>}
                  {day.shifts.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-3 text-center text-body-sm text-muted-foreground">{t('week.off')}</p>
                  ) : (
                    day.shifts.map((shift) => <ShiftCard key={`${shift.branchId}-${shift.startTime}`} shift={shift} />)
                  )}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      <LeaveForm today={today} />
      <LeaveList today={today} />
    </div>
  );
}
