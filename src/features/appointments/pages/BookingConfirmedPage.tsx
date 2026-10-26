import type { ReactNode } from 'react';
import { BellRing, CalendarPlus, Check, Clock, CreditCard, MapPin, ShieldCheck, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useLanguage } from '@/shared/i18n/use-language';
import { buildIcs } from '@/shared/lib/calendar';
import { saveFile } from '@/shared/lib/download';
import { formatDay, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { BranchActions } from '../components/AppointmentBits';
import { useMyAppointment, usePayDeposit } from '../hooks/use-appointments';
import { useLookups } from '../hooks/use-lookups';

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-caption text-muted-foreground">{label}</dt>
        <dd className="text-body-md text-foreground">{children}</dd>
      </div>
    </div>
  );
}

/**
 * "You're booked" (design patient/09, UX_NOTES U1): reference, confirmed by the branch, where and
 * when, calendar, directions, call, the optional deposit and how reminders will arrive.
 */
export default function BookingConfirmedPage() {
  const { t } = useTranslation('appointments');
  const { language } = useLanguage();
  const { appointmentId = '' } = useParams();
  const { user } = useSession();
  const appointment = useMyAppointment(appointmentId);
  const profile = useMyProfile();
  const payDeposit = usePayDeposit();
  const { branch, branchLabel, specialtyLabel } = useLookups();

  if (appointment.isPending) return <LoadingState />;
  if (appointment.isError) return <ErrorState onRetry={() => void appointment.refetch()} />;

  const visit = appointment.data;
  const visitBranch = branch(visit.branchId);
  const address = visitBranch ? (language === 'ar' ? visitBranch.addressAr : visitBranch.addressEn) : '';
  const channel = profile.data?.notificationChannel ?? 'Phone';
  const reminders = { Phone: 'booked.remindersPhone', Email: 'booked.remindersEmail', Both: 'booked.remindersBoth' } as const;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-3 text-center">
        <span aria-hidden="true" className="mx-auto flex size-16 items-center justify-center rounded-full border-4 border-secondary bg-primary text-primary-foreground">
          <Check className="size-8" />
        </span>
        <h1 className="font-display text-headline-xl text-ink">{t('booked.title')}</h1>
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-label-md text-primary">
          {t('booked.reference')}: <bdi dir="ltr" className="ms-1">{visit.reference}</bdi>
        </p>
        <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-label-md text-success">
          <ShieldCheck aria-hidden="true" className="size-4" />
          {t('booked.confirmedBy', { branch: branchLabel(visit.branchId) })}
        </p>
      </header>

      <section aria-labelledby="booking-details" className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 id="booking-details" className="eyebrow">
          {t('booked.details')}
        </h2>
        <div>
          <p className="font-display text-headline-md text-ink">{visit.doctorName}</p>
          <p className="text-body-sm text-muted-foreground">{specialtyLabel(visit.specialtyId)}</p>
        </div>
        <dl className="space-y-3">
          <Row icon={<Clock className="size-5" />} label={t('booked.dateTime')}>
            <span className="block font-semibold">{formatDay(visit.date, language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="block text-body-sm text-muted-foreground">{t('booked.branchTime', { time: formatWallClock(visit.startTime, language) })}</span>
          </Row>
          <Row icon={<MapPin className="size-5" />} label={t('booked.location')}>
            <span className="block font-semibold">{branchLabel(visit.branchId)}</span>
            <span className="block text-body-sm text-muted-foreground">{address}</span>
          </Row>
          {user && (
            <Row icon={<User className="size-5" />} label={t('booked.patient')}>
              <span dir="auto">{user.fullName}</span>
            </Row>
          )}
        </dl>
        <div className="flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-caption text-muted-foreground">{t('booked.fee')}</p>
            <p className="text-body-sm text-muted-foreground">{visit.depositPaid ? t('actions.depositPaid') : t('booked.payAtDesk')}</p>
          </div>
          <p className="font-display text-headline-md text-highlight-strong">{formatMoney(visit.price, language)}</p>
        </div>
      </section>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() =>
          saveFile(
            'clinicflow-visit.ics',
            buildIcs({ uid: visit.id, title: t('booked.calendarTitle', { doctor: visit.doctorName }), start: visit.startsAtUtc, durationMinutes: 30, location: `${branchLabel(visit.branchId)}, ${address}` }),
            'text/calendar'
          )
        }
      >
        <CalendarPlus aria-hidden="true" />
        {t('actions.addToCalendar')}
      </Button>
      <BranchActions branch={visitBranch} />

      {visit.depositAmount && !visit.depositPaid ? (
        <section className="space-y-3 rounded-2xl border border-info/25 bg-info/10 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-title-sm text-ink">
              <CreditCard aria-hidden="true" className="size-5 text-info" />
              {t('booked.depositTitle')}
            </h2>
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-caption text-muted-foreground">{t('booked.depositOptional')}</span>
          </div>
          <p className="text-body-sm text-muted-foreground">{t('booked.depositBody', { amount: formatMoney(visit.depositAmount, language) })}</p>
          <Button variant="outline" className="w-full bg-card" disabled={payDeposit.isPending} onClick={() => payDeposit.mutate(visit.id)}>
            {t('actions.payDeposit', { amount: formatMoney(visit.depositAmount, language) })}
          </Button>
        </section>
      ) : null}

      <section className="flex gap-3 rounded-2xl border border-border bg-card p-4">
        <BellRing aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-label-md text-foreground">{t('booked.remindersTitle')}</p>
          <p className="text-body-sm text-muted-foreground">{t(reminders[channel])}</p>
        </div>
      </section>

      <Button asChild size="lg" className="w-full">
        <Link to="/patient/appointments">{t('booked.viewAppointments')}</Link>
      </Button>
    </div>
  );
}
