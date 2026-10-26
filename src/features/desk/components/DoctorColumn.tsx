import type { ReactNode } from 'react';
import { CheckCircle2, MoreVertical, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { STATUS_TONE } from '@/features/appointments/model/rules';
import { TicketBadge } from '@/features/queue/components/TicketBadge';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatInstant, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { StatusChip } from '@/shared/ui/StatusChip';
import { columnLoad, deskActions, isLate, isOnTheBook, minutesLate, type DoctorColumn as Column } from '../model/day';
import type { DeskAppointment } from '../model/desk';

/** What the signed-in user may do at this branch. */
export interface DeskPermissions {
  checkIn: boolean;
  noShow: boolean;
  collect: boolean;
}

interface VisitCardProps {
  visit: DeskAppointment;
  now: Date;
  timeZone: string;
  can: DeskPermissions;
  onCheckIn: (appointmentId: string) => void;
  onNoShow: (visit: DeskAppointment) => void;
}

function VisitCard({ visit, now, timeZone, can, onCheckIn, onNoShow }: VisitCardProps) {
  const { t } = useTranslation(['desk', 'appointments', 'queue']);
  const { language } = useLanguage();
  const { serviceLabel } = useLookups();
  const actions = deskActions(visit, now);
  const late = isLate(visit, now);
  const muted = !isOnTheBook(visit) || visit.status === 'NoShow' || (visit.status === 'Completed' && visit.amountDue === 0);
  const time = (iso: string) => formatInstant(iso, language, timeZone, { hour: 'numeric', minute: '2-digit' });

  let footer: ReactNode = null;
  if (visit.status === 'Confirmed') {
    footer = actions.checkIn && can.checkIn ? (
      <Button size="sm" onClick={() => onCheckIn(visit.id)}>
        <UserCheck aria-hidden="true" />
        {t('day.checkIn')}
      </Button>
    ) : actions.checkInOpensAt ? (
      <span className="text-body-sm text-muted-foreground">{t('day.checkInOpens', { time: time(actions.checkInOpensAt) })}</span>
    ) : null;
  } else if (visit.status === 'CheckedIn' && visit.queue) {
    footer = <span className="text-body-sm text-muted-foreground">{t(`queue:stage.${visit.queue.stage}`)}</span>;
  } else if (visit.status === 'InProgress') {
    footer = <span className="text-body-sm text-muted-foreground">{visit.room ? t('day.inRoom', { room: nameIn(visit.room, language) }) : t('queue:stage.WithDoctor')}</span>;
  } else if (visit.status === 'Completed') {
    footer = visit.amountDue > 0 ? (
      can.collect ? (
        <Button asChild size="sm" variant="secondary">
          <Link to={`/desk/payments?visit=${visit.id}`}>{t('day.collect', { amount: formatMoney(visit.amountDue, language) })}</Link>
        </Button>
      ) : (
        <span className="text-body-sm font-medium text-warning">{t('day.due', { amount: formatMoney(visit.amountDue, language) })}</span>
      )
    ) : (
      <span className="text-body-sm text-success">{t('day.paid')}</span>
    );
  }

  return (
    <article
      className={cn(
        'space-y-2 rounded-xl border bg-card p-3 shadow-card',
        visit.status === 'InProgress' ? 'border-primary ring-1 ring-primary' : late ? 'border-destructive/40' : 'border-border',
        muted && 'opacity-70'
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <p className={cn('text-label-md tabular-nums', late ? 'text-destructive' : 'text-foreground', !isOnTheBook(visit) && 'line-through')}>
          {/* Arabic times end in ص/م, so the range follows the page's direction rather than a forced LTR isolate */}
          {formatWallClock(visit.startTime, language)} – {formatWallClock(visit.endTime, language)}
        </p>
        {late ? (
          <StatusChip tone="danger">{t('day.late', { minutes: minutesLate(visit, now) })}</StatusChip>
        ) : (
          <StatusChip tone={STATUS_TONE[visit.status]}>{t(`appointments:status.${visit.status}`)}</StatusChip>
        )}
      </header>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-title-sm text-ink"><bdi>{visit.patient.fullName}</bdi></h3>
          <p className="truncate text-body-sm text-muted-foreground">
            <bdi dir="ltr">{visit.patient.mrn}</bdi> · {serviceLabel(visit.serviceId)}
          </p>
        </div>
        {visit.queue && <TicketBadge ticket={visit.queue.ticketNo} />}
      </div>
      <footer className="flex min-h-9 items-center justify-between gap-2 border-t border-border pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {visit.source === 'WalkIn' && <StatusChip tone="highlight">{t('day.walkIn')}</StatusChip>}
          {visit.status === 'Confirmed' && visit.attendanceConfirmed && (
            <span className="inline-flex items-center gap-1 text-body-sm text-success">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              {t('day.patientConfirmed')}
            </span>
          )}
          {visit.status === 'Confirmed' && visit.depositPaid && <span className="text-body-sm text-info">{t('day.depositPaid')}</span>}
        </div>
        <div className="flex items-center gap-1">
          {footer}
          {actions.noShow && can.noShow && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t('day.more', { name: visit.patient.fullName })}>
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onNoShow(visit)}>{t('day.markNoShow')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </footer>
    </article>
  );
}

interface DoctorColumnProps extends Omit<VisitCardProps, 'visit'> {
  column: Column;
}

/** One doctor's day (design front-desk/01): name, room, how busy, and the visits in time order. */
export function DoctorColumn({ column, ...cardProps }: DoctorColumnProps) {
  const { t } = useTranslation('desk');
  const { language } = useLanguage();
  const { specialtyLabel } = useLookups();
  const load = columnLoad(column);

  return (
    <section aria-labelledby={`doctor-${column.doctorId}`} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-3">
      <header className="flex items-start gap-3 px-1">
        <Avatar name={column.doctorName.replace(/^Dr\.\s*/, '')} />
        <div className="min-w-0 flex-1">
          <h2 id={`doctor-${column.doctorId}`} className="truncate text-title-sm text-ink">{column.doctorName}</h2>
          <p className="truncate text-body-sm text-primary">
            {specialtyLabel(column.specialtyId)}
            {column.room && ` · ${nameIn(column.room, language)}`}
          </p>
        </div>
        <StatusChip tone={load.tone}>
          {t(load.withDoctor ? 'day.busy' : 'day.onSchedule')} <bdi dir="ltr">({load.seen}/{load.total})</bdi>
        </StatusChip>
      </header>
      <ul className="space-y-2">
        {column.appointments.map((visit) => (
          <li key={visit.id}>
            <VisitCard visit={visit} {...cardProps} />
          </li>
        ))}
      </ul>
    </section>
  );
}
