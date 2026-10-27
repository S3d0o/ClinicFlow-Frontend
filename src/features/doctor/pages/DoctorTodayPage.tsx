import { ArrowRight, CalendarCheck, Clock, Timer, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { useCallPatient, useQueueLive } from '@/features/queue/hooks/use-queue';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay, formatNumber } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatTile } from '@/shared/ui/StatTile';
import { DayList } from '../components/DayList';
import { NextPatientCard } from '../components/NextPatientCard';
import { ShiftCard } from '../components/ShiftCard';
import { UnsignedPanel } from '../components/UnsignedPanel';
import { useDoctorDay } from '../hooks/use-doctor';
import type { DoctorVisit } from '../model/doctor-day';
import { dayStats, inRoom, nextPatient } from '../model/rules';

/** Keeps the day live at one branch: a check-in or triage there refreshes it (FR-FD-04). */
function LiveBranch({ branchId }: { branchId: string }) {
  useQueueLive(branchId);
  return null;
}

/** The doctor's day (design doctor/01, 05 §4.1): counters, the next patient, the day's visits, shifts and notes to sign. */
export default function DoctorTodayPage() {
  const { t } = useTranslation(['doctor', 'screens']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const { activeBranch } = useActiveBranch();
  const { now, today, time, timeZone } = useBranchClock(activeBranch);
  const day = useDoctorDay(today);
  const call = useCallPatient();

  const callIn = (visit: DoctorVisit) =>
    call.mutate(visit.id, {
      onSuccess: () => {
        toast.success(t('next.called', { name: visit.patient.fullName }));
        navigate(`/doctor/encounters/${visit.id}`);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });

  const header = (
    <PageHeader
      title={t('screens:doctorToday')}
      description={`${formatDay(today, language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${user?.fullName ?? ''}`}
    />
  );

  if (day.isPending) return <div className="space-y-6">{header}<LoadingState /></div>;
  if (day.isError) return <div className="space-y-6">{header}<ErrorState onRetry={() => void day.refetch()} /></div>;

  const { visits, shifts } = day.data;
  const stats = dayStats(visits);
  const next = nextPatient(visits);
  const current = inRoom(visits);
  const branchIds = [...new Set([...shifts.map((s) => s.branchId), ...visits.map((v) => v.branchId)])];
  const shiftNow = shifts.find((s) => !s.onLeave && s.startTime <= time && time < s.endTime);

  return (
    <div className="space-y-6">
      {branchIds.map((id) => <LiveBranch key={id} branchId={id} />)}
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t('stats.seen')}
          value={stats.seen}
          hint={t('stats.ofBooked', { count: stats.booked })}
          icon={<CalendarCheck className="size-5" />}
        />
        <StatTile label={t('stats.waiting')} value={stats.waiting} hint={t('stats.ready', { count: stats.ready })} icon={<Users className="size-5" />} />
        <StatTile
          label={t('stats.average')}
          value={stats.averageConsultMinutes !== undefined ? formatNumber(stats.averageConsultMinutes, language) : '—'}
          hint={t('stats.minutes')}
          icon={<Timer className="size-5" />}
        />
        <StatTile
          label={t('stats.shift')}
          value={<span className="text-headline-md">{shiftNow ? t('stats.inShift') : shifts.some((s) => !s.onLeave && s.startTime > time) ? t('stats.later') : t('stats.noShift')}</span>}
          hint={shiftNow?.room ? nameIn(shiftNow.room, language) : undefined}
          icon={<Clock className="size-5" />}
        />
      </div>

      {current && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-body-md text-ink">
            {t('inRoom.text', { name: current.patient.fullName })}
          </p>
          <Button asChild className="ms-auto">
            <Link to={`/doctor/encounters/${current.id}`}>
              {t('inRoom.continue')}
              <ArrowRight aria-hidden="true" className="rtl-flip" />
            </Link>
          </Button>
        </div>
      )}

      {next ? (
        <NextPatientCard visit={next} inRoom={current} now={now} today={today} timeZone={timeZone} calling={call.isPending} onCall={callIn} />
      ) : (
        !current && stats.waiting > 0 && (
          <p className="rounded-2xl border border-dashed border-border p-4 text-body-md text-muted-foreground">{t('next.inTriage', { count: stats.waiting })}</p>
        )
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="day-heading" className="space-y-3">
          <h2 id="day-heading" className="font-display text-headline-md text-ink">{t('day.title')}</h2>
          <DayList visits={visits} nextId={next?.id} />
        </section>
        <aside className="space-y-4">
          <section aria-labelledby="shifts-heading" className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <h2 id="shifts-heading" className="text-title-sm text-ink">{t('shift.title')}</h2>
            {shifts.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">{t('shift.none')}</p>
            ) : (
              shifts.map((shift) => <ShiftCard key={`${shift.branchId}-${shift.startTime}`} shift={shift} current={shift === shiftNow} />)
            )}
            <Button asChild variant="link" className="px-0">
              <Link to="/doctor/schedule">{t('shift.mySchedule')}</Link>
            </Button>
          </section>
          <UnsignedPanel now={now} />
        </aside>
      </div>
    </div>
  );
}
