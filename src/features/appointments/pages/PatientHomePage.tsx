import type { ReactNode } from 'react';
import { CalendarPlus, ChevronRight, MapPin, Phone, Pill, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/hooks/use-session';
import { useLanguage } from '@/shared/i18n/use-language';
import { todayIn, wallClockIn } from '@/shared/lib/branch-time';
import { formatDay, formatWallClock } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { telHref } from '@/shared/lib/places';
import { useNow } from '@/shared/lib/use-now';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentStatusChip, BranchActions } from '../components/AppointmentBits';
import { QueuePanel } from '../components/QueuePanel';
import { useLiveQueue, useMyAppointments } from '../hooks/use-appointments';
import { useLookups } from '../hooks/use-lookups';
import type { Appointment } from '../model/appointment';
import { featuredAppointment, splitUpcomingPast } from '../model/rules';

const CAIRO = 'Africa/Cairo';

function QuickAction({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-center text-label-md text-foreground transition-colors hover:border-primary hover:text-primary">
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </span>
      {label}
    </Link>
  );
}

/** Today's (or the next) appointment, with the live queue once the patient has checked in (U3). */
function FeaturedVisit({ appointment, isToday }: { appointment: Appointment; isToday: boolean }) {
  const { t } = useTranslation('appointments');
  const { language } = useLanguage();
  const { branch, branchLabel, specialtyLabel } = useLookups();
  const queue = useLiveQueue(appointment.id, appointment.queue);
  const visitBranch = branch(appointment.branchId);

  return (
    <section aria-labelledby="featured-title" className="space-y-4 rounded-2xl border border-border border-t-4 border-t-primary bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="featured-title" className="eyebrow">
          {isToday ? t('home.todayVisit') : t('home.nextVisit')}
        </h2>
        <AppointmentStatusChip status={appointment.status} />
      </div>
      <Link to={`/patient/appointments/${appointment.id}`} className="block space-y-1 rounded-lg hover:opacity-90">
        <p className="font-display text-headline-md text-ink">{appointment.doctorName}</p>
        <p className="text-body-sm text-muted-foreground">{specialtyLabel(appointment.specialtyId)}</p>
        <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <MapPin aria-hidden="true" className="size-4" />
          {branchLabel(appointment.branchId)}
        </p>
      </Link>
      <p className="rounded-xl bg-muted/50 px-3 py-2 text-body-md">
        <span className="text-muted-foreground">{t('card.time')}: </span>
        <span className="font-semibold text-foreground">
          {!isToday && `${formatDay(appointment.date, language, { weekday: 'long', day: 'numeric', month: 'long' })} · `}
          <bdi dir="ltr">{formatWallClock(appointment.startTime, language)}</bdi>
        </span>
      </p>
      {queue && <QueuePanel queue={queue} doctorName={appointment.doctorName} />}
      <BranchActions branch={visitBranch} />
    </section>
  );
}

/** The patient portal's home (02 §8): the visit that matters now, shortcuts, and what's coming. */
export default function PatientHomePage() {
  const { t } = useTranslation(['appointments', 'screens']);
  const { language } = useLanguage();
  const { user } = useSession();
  const now = useNow();
  const appointments = useMyAppointments();
  const { branches, branchLabel } = useLookups();

  const today = todayIn(CAIRO, now);
  const hour = Number(wallClockIn(CAIRO, now).slice(0, 2));
  const greeting = hour < 12 ? 'home.greetingMorning' : hour < 17 ? 'home.greetingAfternoon' : 'home.greetingEvening';
  const firstName = user?.fullName.split(' ')[0] ?? '';

  const featured = appointments.data && featuredAppointment(appointments.data, today);
  const others = appointments.data ? splitUpcomingPast(appointments.data).upcoming.filter((a) => a.id !== featured?.id).slice(0, 2) : [];
  const contactBranch = branches.find((b) => b.id === featured?.branchId) ?? branches[0];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-headline-lg text-ink">{t(greeting, { name: firstName })}</h1>
        <p className="text-body-md text-muted-foreground">{formatDay(today, language, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      {appointments.isPending ? (
        <LoadingState />
      ) : appointments.isError ? (
        <ErrorState onRetry={() => void appointments.refetch()} />
      ) : featured ? (
        <FeaturedVisit appointment={featured} isToday={featured.date === today} />
      ) : (
        <EmptyState
          className="rounded-2xl border border-dashed border-border"
          title={t('home.noUpcomingTitle')}
          description={t('home.noUpcomingBody')}
          action={
            <Button asChild>
              <Link to="/patient/book">{t('home.bookAgain')}</Link>
            </Button>
          }
        />
      )}

      <section aria-labelledby="quick-title" className="space-y-3">
        <h2 id="quick-title" className="font-display text-title-sm text-ink">
          {t('home.quickActions')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction to="/patient/book" icon={<CalendarPlus className="size-5" />} label={t('home.bookAgain')} />
          <QuickAction to="/patient/visits" icon={<Pill className="size-5" />} label={t('home.prescriptions')} />
          <QuickAction to="/patient/invoices" icon={<ReceiptText className="size-5" />} label={t('home.invoices')} />
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="upcoming-title" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="upcoming-title" className="font-display text-title-sm text-ink">
              {t('home.upcoming')}
            </h2>
            <Link to="/patient/appointments" className="inline-flex items-center gap-1 text-label-md text-primary hover:underline">
              {t('home.viewAll')}
              <ChevronRight aria-hidden="true" className="rtl-flip size-4" />
            </Link>
          </div>
          {others.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} now={now} />
          ))}
        </section>
      )}

      {contactBranch && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="min-w-0">
            <p className="font-display text-title-sm text-ink">{t('home.contactBranch', { branch: branchLabel(contactBranch.id) })}</p>
            <p className="text-body-sm text-muted-foreground">{language === 'ar' ? contactBranch.addressAr : contactBranch.addressEn}</p>
          </div>
          <Button asChild variant="outline">
            <a href={telHref(contactBranch.phone)}>
              <Phone aria-hidden="true" />
              <bdi dir="ltr">{formatEgyptianPhone(contactBranch.phone)}</bdi>
            </a>
          </Button>
        </section>
      )}
    </div>
  );
}
