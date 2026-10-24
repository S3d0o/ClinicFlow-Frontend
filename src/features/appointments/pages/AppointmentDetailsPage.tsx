import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, CalendarPlus, ChevronDown, Clock, CreditCard, MapPin, Star, Stethoscope, XCircle } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isServiceError } from '@/shared/api/service-error';
import { useLanguage } from '@/shared/i18n/use-language';
import { buildIcs } from '@/shared/lib/calendar';
import { saveFile } from '@/shared/lib/download';
import { formatDay, formatInstant, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { telHref } from '@/shared/lib/places';
import { useNow } from '@/shared/lib/use-now';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { AppointmentStatusChip, BranchActions } from '../components/AppointmentBits';
import { CancelForm, RescheduleForm } from '../components/ChangeVisit';
import { QueuePanel } from '../components/QueuePanel';
import { ReviewDialog } from '../components/ReviewDialog';
import { useLiveQueue, useMyAppointment, usePayDeposit } from '../hooks/use-appointments';
import { useLookups } from '../hooks/use-lookups';
import { isActive, patientActions } from '../model/rules';

function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5', className)}>
      {title && <h2 className="font-display text-title-sm text-ink">{title}</h2>}
      {children}
    </section>
  );
}

/** A collapsible section (reschedule, cancel), opened by `?action=` from the lists. */
function Expandable({ title, icon, open, onToggle, children }: { title: string; icon: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-12 w-full items-center gap-3 px-4 text-start text-label-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

/** One appointment (design patient/11): live queue, place, fee and deposit, and changes. */
export default function AppointmentDetailsPage() {
  const { appointmentId = '' } = useParams();
  // A fresh page per appointment, so an open section or dialog doesn't carry over to the next one
  return <AppointmentDetails key={appointmentId} appointmentId={appointmentId} />;
}

function AppointmentDetails({ appointmentId }: { appointmentId: string }) {
  const { t } = useTranslation(['appointments', 'common']);
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const now = useNow();
  const appointment = useMyAppointment(appointmentId);
  const payDeposit = usePayDeposit();
  const { branch, branchLabel, specialtyLabel, serviceLabel } = useLookups();
  const queue = useLiveQueue(appointment.data?.id, appointment.data?.queue);
  const [open, setOpen] = useState<'reschedule' | 'cancel' | null>(() => {
    const action = params.get('action');
    return action === 'reschedule' || action === 'cancel' ? action : null;
  });
  const [reviewing, setReviewing] = useState(false);

  // Coming back from the deposit checkout
  const paid = params.get('payment') === 'success';
  useEffect(() => {
    if (!paid) return;
    toast.success(t('actions.paymentDone'));
    setParams((current) => {
      current.delete('payment');
      return current;
    }, { replace: true });
  }, [paid, setParams, t]);

  if (appointment.isPending) return <LoadingState />;
  if (appointment.isError) {
    return isServiceError(appointment.error, 'Appointment.NotFound') ? (
      <EmptyState title={t('common:notFound.title')} action={<Button asChild><Link to="/patient/appointments">{t('list.title')}</Link></Button>} />
    ) : (
      <ErrorState onRetry={() => void appointment.refetch()} />
    );
  }

  const visit = appointment.data;
  const visitBranch = branch(visit.branchId);
  const timeZone = visitBranch?.timeZone ?? 'Africa/Cairo';
  const actions = patientActions(visit, now);
  const address = visitBranch ? (language === 'ar' ? visitBranch.addressAr : visitBranch.addressEn) : '';
  const balance = visit.price - (visit.depositPaid ? (visit.depositAmount ?? 0) : 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label={t('common:actions.back')}>
          <Link to="/patient/appointments">
            <ArrowLeft className="rtl-flip" />
          </Link>
        </Button>
        <h1 className="flex-1 font-display text-headline-md text-ink">{t('details.title')}</h1>
        <AppointmentStatusChip status={visit.status} />
      </header>

      {queue && (
        <Panel>
          <QueuePanel queue={queue} doctorName={visit.doctorName} />
        </Panel>
      )}

      <Panel>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <Link to={`/doctors/${visit.doctorId}`} className="font-display text-headline-md text-ink hover:text-primary">
              {visit.doctorName}
            </Link>
            <p className="text-body-sm text-muted-foreground">{specialtyLabel(visit.specialtyId)}</p>
            <p className="text-caption text-muted-foreground">
              <Trans t={t} i18nKey="card.reference" values={{ reference: visit.reference }} components={{ num: <bdi dir="ltr" /> }} />
            </p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/50 p-3">
            <dt className="text-caption text-muted-foreground">{t('details.scheduled')}</dt>
            <dd className="flex items-center gap-1.5 font-semibold">
              <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
              <bdi dir="ltr">{formatWallClock(visit.startTime, language)}</bdi>
            </dd>
            <dd className="text-body-sm text-muted-foreground">{formatDay(visit.date, language, { weekday: 'long', day: 'numeric', month: 'long' })}</dd>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <dt className="text-caption text-muted-foreground">{t('details.service')}</dt>
            <dd className="font-semibold">{serviceLabel(visit.serviceId)}</dd>
          </div>
        </dl>
        {isActive(visit) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              saveFile(
                'clinicflow-visit.ics',
                buildIcs({
                  uid: visit.id,
                  title: t('booked.calendarTitle', { doctor: visit.doctorName }),
                  start: visit.startsAtUtc,
                  durationMinutes: 30,
                  location: `${branchLabel(visit.branchId)}, ${address}`,
                }),
                'text/calendar'
              )
            }
          >
            <CalendarPlus aria-hidden="true" />
            {t('actions.addToCalendar')}
          </Button>
        )}
      </Panel>

      <Panel title={t('details.branch')}>
        <p className="font-semibold text-foreground">{branchLabel(visit.branchId)}</p>
        <p className="flex items-start gap-1.5 text-body-sm text-muted-foreground">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {address}
        </p>
        <BranchActions branch={visitBranch} />
      </Panel>

      <Panel title={t('details.billing')}>
        <dl className="space-y-2 text-body-md">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('details.fee')}</dt>
            <dd>{formatMoney(visit.price, language)}</dd>
          </div>
          {visit.depositPaid && visit.depositAmount ? (
            <div className="flex justify-between text-success">
              <dt>{t('details.depositPaid')}</dt>
              <dd>− {formatMoney(visit.depositAmount, language)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <dt>{t('details.balance')}</dt>
            <dd className="text-highlight-strong">{formatMoney(balance, language)}</dd>
          </div>
        </dl>
        {actions.payDeposit && (
          <Button variant="outline" className="w-full" disabled={payDeposit.isPending} onClick={() => payDeposit.mutate(visit.id)}>
            <CreditCard aria-hidden="true" />
            {t('actions.payDeposit', { amount: formatMoney(visit.depositAmount!, language) })}
          </Button>
        )}
      </Panel>

      {actions.change && (
        <Panel title={t('details.changeTitle')}>
          <p className="text-body-sm text-muted-foreground">
            {t('details.changeIntro', {
              time: formatInstant(visit.changeableUntil, language, timeZone, { weekday: 'long', hour: 'numeric', minute: '2-digit' }),
            })}
          </p>
          <Expandable
            title={t('details.pickNewTime')}
            icon={<CalendarPlus aria-hidden="true" className="size-4 text-primary" />}
            open={open === 'reschedule'}
            onToggle={() => setOpen(open === 'reschedule' ? null : 'reschedule')}
          >
            <RescheduleForm appointment={visit} timeZone={timeZone} onDone={() => setOpen(null)} />
          </Expandable>
          <Expandable
            title={t('details.cancelTitle')}
            icon={<XCircle aria-hidden="true" className="size-4 text-destructive" />}
            open={open === 'cancel'}
            onToggle={() => setOpen(open === 'cancel' ? null : 'cancel')}
          >
            <CancelForm appointment={visit} onDone={() => setOpen(null)} />
          </Expandable>
        </Panel>
      )}

      {actions.tooLateToChange && visitBranch && (
        <Panel>
          <p className="text-body-md text-muted-foreground">{t('card.tooLate')}</p>
          <Button asChild variant="outline">
            <a href={telHref(visitBranch.phone)}>{t('details.callBranch', { branch: `${branchLabel(visit.branchId)} (${formatEgyptianPhone(visitBranch.phone)})` })}</a>
          </Button>
        </Panel>
      )}

      {visit.status === 'Rescheduled' && visit.rescheduledToId && (
        <Panel title={t('details.rescheduledTitle')}>
          <Button asChild>
            <Link to={`/patient/appointments/${visit.rescheduledToId}`}>{t('details.openNew')}</Link>
          </Button>
        </Panel>
      )}

      {(actions.review || actions.viewSummary) && (
        <Panel>
          <div className="flex flex-wrap gap-2">
            {actions.viewSummary && (
              <Button asChild>
                <Link to={`/patient/visits/${visit.visitId}`}>{t('card.viewSummary')}</Link>
              </Button>
            )}
            {actions.review && (
              <Button variant="outline" onClick={() => setReviewing(true)}>
                <Star aria-hidden="true" />
                {t('card.leaveReview')}
              </Button>
            )}
          </div>
        </Panel>
      )}

      {reviewing && <ReviewDialog appointment={visit} onClose={() => setReviewing(false)} />}
    </div>
  );
}
