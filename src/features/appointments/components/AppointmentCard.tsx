import { Clock, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { todayIn } from '@/shared/lib/branch-time';
import { formatInstant, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { useLookups } from '../hooks/use-lookups';
import type { Appointment } from '../model/appointment';
import { patientActions } from '../model/rules';
import { AppointmentStatusChip, DateTile } from './AppointmentBits';

interface AppointmentCardProps {
  appointment: Appointment;
  now: Date;
  /** Opens the review dialog for a completed visit. */
  onReview?: (appointment: Appointment) => void;
}

const detailsPath = (appointment: Appointment, action?: 'reschedule' | 'cancel') =>
  `/patient/appointments/${appointment.id}${action ? `?action=${action}` : ''}`;

/** One appointment in a list: when, who, where, the status and what the patient can do now. */
export function AppointmentCard({ appointment, now, onReview }: AppointmentCardProps) {
  const { t } = useTranslation('appointments');
  const { language } = useLanguage();
  const { branch, branchLabel, serviceLabel } = useLookups();
  const timeZone = branch(appointment.branchId)?.timeZone ?? 'Africa/Cairo';
  const actions = patientActions(appointment, now);
  const isToday = appointment.date === todayIn(timeZone, now);

  return (
    <article className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex gap-3">
        <DateTile date={appointment.date} isToday={isToday} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-display text-title-sm text-ink">
              <Link to={detailsPath(appointment)} className="hover:text-primary">
                {appointment.doctorName}
              </Link>
            </h3>
            <AppointmentStatusChip status={appointment.status} />
          </div>
          <p className="text-body-sm text-muted-foreground">{serviceLabel(appointment.serviceId)}</p>
        </div>
      </div>

      <dl className="grid gap-2 rounded-xl bg-muted/50 p-3 text-body-sm sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <dt className="sr-only">{t('details.branch')}</dt>
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <dd>{branchLabel(appointment.branchId)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">{t('card.time')}</dt>
          <Clock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <dd>
            <bdi dir="ltr">{formatWallClock(appointment.startTime, language)}</bdi>
            {appointment.queue && (
              <span className="text-muted-foreground">
                {' · '}
                {t('queue.ticket')} <bdi dir="ltr">{appointment.queue.ticketNo}</bdi>
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <dt className="text-muted-foreground">{t('card.fee')}</dt>
          <dd className="font-semibold text-highlight-strong">{formatMoney(appointment.price, language)}</dd>
        </div>
      </dl>

      {appointment.status === 'Cancelled' && appointment.cancelledBy && (
        <p className="text-body-sm text-muted-foreground">
          {t('card.cancelledBy', { who: appointment.cancelledBy === 'Patient' ? t('card.cancelledByPatient') : t('card.cancelledByClinic') })}
          {appointment.cancellationReason && ` · ${t(`reasons.${appointment.cancellationReason}`)}`}
        </p>
      )}
      {appointment.status === 'Rescheduled' && <p className="text-body-sm text-muted-foreground">{t('card.rescheduledNote')}</p>}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={actions.change ? 'default' : 'outline'} size="sm">
          <Link to={detailsPath(appointment)}>{t('card.viewDetails')}</Link>
        </Button>
        {actions.change && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={detailsPath(appointment, 'reschedule')}>{t('card.reschedule')}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={detailsPath(appointment, 'cancel')}>{t('card.cancel')}</Link>
            </Button>
          </>
        )}
        {actions.review && onReview && (
          <Button variant="outline" size="sm" onClick={() => onReview(appointment)}>
            <Star aria-hidden="true" />
            {t('card.leaveReview')}
          </Button>
        )}
        {actions.viewSummary && (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/patient/visits/${appointment.visitId}`}>{t('card.viewSummary')}</Link>
          </Button>
        )}
      </div>

      {actions.change && (
        <p className="text-caption text-muted-foreground">
          {t('card.changeUntil', {
            time: formatInstant(appointment.changeableUntil, language, timeZone, { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
          })}
        </p>
      )}
      {actions.tooLateToChange && <p className="text-caption text-warning">{t('card.tooLate')}</p>}
    </article>
  );
}
