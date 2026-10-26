import { useMemo, useState } from 'react';
import { CalendarCheck, Footprints, Plus, UserCheck, UserX, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { BranchRequired } from '@/features/org/components/BranchRequired';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { branchName } from '@/features/org/model/branch-access';
import type { Branch } from '@/features/org/model/branch';
import { useQueueLive } from '@/features/queue/hooks/use-queue';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatTile } from '@/shared/ui/StatTile';
import { CheckInSheet } from '../components/CheckInSheet';
import { DoctorColumn, type DeskPermissions } from '../components/DoctorColumn';
import { NeedsActionPanel } from '../components/NeedsActionPanel';
import { useDeskDay, useMarkNoShow } from '../hooks/use-desk';
import { byDoctor, dayCounters, needsAction } from '../model/day';
import type { DeskAppointment } from '../model/desk';

function DeskToday({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['desk', 'screens']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const { specialtyLabel } = useLookups();
  const { now, today, timeZone } = useBranchClock(branch);
  const day = useDeskDay(branch.id, today);
  const noShow = useMarkNoShow();
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  useQueueLive(branch.id);

  const permissions: DeskPermissions = {
    checkIn: can(user, 'appointments.check_in', branch.id),
    noShow: can(user, 'appointments.mark_no_show', branch.id),
    collect: can(user, 'payments.collect', branch.id),
  };
  const canBook = can(user, 'appointments.book_on_behalf', branch.id);

  const visits = useMemo(() => day.data ?? [], [day.data]);
  const specialties = useMemo(() => [...new Set(visits.map((v) => v.specialtyId))], [visits]);
  const shown = specialtyId ? visits.filter((v) => v.specialtyId === specialtyId) : visits;
  const counters = dayCounters(visits);

  const markNoShow = (visit: DeskAppointment) =>
    noShow.mutate(visit.id, {
      onSuccess: () => toast.success(t('day.noShowDone', { name: visit.patient.fullName })),
      onError: (error) => toast.error(errorMessage(error)),
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('screens:deskToday')}
        description={`${formatDay(today, language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${branchName(branch, language)}`}
        actions={
          canBook && (
            <>
              <Button asChild>
                <Link to="/desk/book">
                  <Plus aria-hidden="true" />
                  {t('day.newBooking')}
                </Link>
              </Button>
              {permissions.checkIn && (
                <Button asChild variant="outline">
                  <Link to="/desk/book?mode=walk-in">
                    <Footprints aria-hidden="true" />
                    {t('day.walkInArrival')}
                  </Link>
                </Button>
              )}
            </>
          )
        }
      />

      {day.isPending ? (
        <LoadingState />
      ) : day.isError ? (
        <ErrorState onRetry={() => void day.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label={t('counters.booked')} value={counters.booked} icon={<CalendarCheck className="size-5" />} />
            <StatTile
              label={t('counters.checkedIn')}
              value={counters.checkedIn}
              hint={counters.booked ? t('counters.share', { percent: Math.round((counters.checkedIn / counters.booked) * 100) }) : undefined}
              icon={<UserCheck className="size-5" />}
            />
            <StatTile label={t('counters.waiting')} value={counters.waiting} hint={t('counters.waitingHint')} icon={<Users className="size-5" />} />
            <StatTile label={t('counters.noShow')} value={counters.noShow} icon={<UserX className="size-5" />} />
          </div>

          <NeedsActionPanel items={needsAction(visits, now)} now={now} canCollect={permissions.collect} />

          {visits.length === 0 ? (
            <EmptyState className="rounded-2xl border border-dashed border-border" title={t('day.emptyTitle')} description={t('day.emptyBody')} />
          ) : (
            <section aria-labelledby="doctors-heading" className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 id="doctors-heading" className="font-display text-headline-md text-ink">{t('day.doctors')}</h2>
                <FilterChips
                  label={t('day.filterLabel')}
                  options={[{ value: null, label: t('day.allClinics') }, ...specialties.map((id) => ({ value: id, label: specialtyLabel(id) }))]}
                  value={specialtyId}
                  onChange={setSpecialtyId}
                />
              </div>
              <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {byDoctor(shown).map((column) => (
                  <DoctorColumn
                    key={column.doctorId}
                    column={column}
                    now={now}
                    timeZone={timeZone}
                    can={permissions}
                    onCheckIn={setCheckInId}
                    onNoShow={markNoShow}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CheckInSheet appointmentId={checkInId} onClose={() => setCheckInId(null)} canCollect={permissions.collect} />
    </div>
  );
}

/** The front desk's day (design front-desk/01, FR-FD-03/04, U7): counters, what needs action, each doctor's visits. */
export default function DeskTodayPage() {
  return <BranchRequired>{(branch) => <DeskToday branch={branch} />}</BranchRequired>;
}
