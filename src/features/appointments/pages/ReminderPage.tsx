import type { ReactNode } from 'react';
import { CalendarClock, CheckCircle2, Clock, Info, MapPin, Navigation, Phone, ThumbsUp, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { addDays, todayIn } from '@/shared/lib/branch-time';
import { formatDay, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { directionsHref, telHref } from '@/shared/lib/places';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { Logo } from '@/shared/ui/Logo';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { useReminder, useReminderAction } from '../hooks/use-appointments';
import { useLookups } from '../hooks/use-lookups';

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between">
        <Logo />
        <LanguageToggle />
      </header>
      {children}
    </div>
  );
}

/**
 * The page the reminder message links to (`/r/:token`, design patient/12, UX_NOTES U2): confirm with one
 * tap, reschedule (after signing in) or cancel. Works without signing in.
 */
export default function ReminderPage() {
  const { t } = useTranslation(['appointments', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { token = '' } = useParams();
  const reminder = useReminder(token);
  const confirm = useReminderAction(token, 'confirm');
  const cancel = useReminderAction(token, 'cancel');
  const { branch, branchLabel, specialtyLabel } = useLookups();

  if (reminder.isPending) return <Frame><LoadingState /></Frame>;
  if (reminder.isError) {
    return (
      <Frame>
        <ErrorState
          title={t('reminder.invalidTitle')}
          description={t('reminder.invalidBody')}
          action={
            <Button asChild>
              <Link to="/patient/appointments">{t('list.title')}</Link>
            </Button>
          }
        />
      </Frame>
    );
  }

  const visit = reminder.data;
  const visitBranch = branch(visit.branchId);
  const today = todayIn(visitBranch?.timeZone ?? 'Africa/Cairo');
  const time = formatWallClock(visit.startTime, language);
  const title =
    visit.date === today
      ? t('reminder.titleToday', { time })
      : visit.date === addDays(today, 1)
        ? t('reminder.titleTomorrow', { time })
        : t('reminder.titleOn', { date: formatDay(visit.date, language, { weekday: 'long', day: 'numeric', month: 'long' }), time });
  const address = visitBranch ? (language === 'ar' ? visitBranch.addressAr : visitBranch.addressEn) : '';
  const active = visit.status === 'Confirmed';
  const actionError = confirm.error ?? cancel.error;

  return (
    <Frame>
      <div className="space-y-4">
        <section className="space-y-2 rounded-2xl border border-border border-t-4 border-t-primary bg-card p-5 shadow-card">
          <p className="text-label-sm uppercase tracking-[0.06em] text-highlight-strong">{t('reminder.eyebrow')}</p>
          <h1 className="font-display text-headline-lg text-ink">
            {visit.status === 'Cancelled' ? t('reminder.cancelledTitle') : title}
          </h1>
          {active && !visit.attendanceConfirmed && <p className="text-body-md text-muted-foreground">{t('reminder.intro')}</p>}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-title-sm text-ink">{visit.doctorName}</p>
              <p className="text-body-sm text-muted-foreground">{specialtyLabel(visit.specialtyId)}</p>
            </div>
            <span className="rounded-md bg-muted px-2 py-0.5 text-caption text-muted-foreground">
              <bdi dir="ltr">{visit.reference}</bdi>
            </span>
          </div>
          <dl className="space-y-2 rounded-xl bg-muted/50 p-3 text-body-md">
            <div className="flex items-start gap-2">
              <dt className="sr-only">{t('booked.dateTime')}</dt>
              <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <dd>
                {formatDay(visit.date, language, { weekday: 'long', day: 'numeric', month: 'long' })} · <bdi dir="ltr">{time}</bdi>
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">{t('booked.location')}</dt>
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <dd>
                {branchLabel(visit.branchId)} · {address}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <dt className="text-muted-foreground">{t('booked.fee')}</dt>
              <dd className="font-semibold text-highlight-strong">{formatMoney(visit.price, language)}</dd>
            </div>
          </dl>
        </section>

        {actionError && <FormAlert>{errorMessage(actionError)}</FormAlert>}

        {active && visit.attendanceConfirmed && (
          <FormAlert tone="success">{t('reminder.confirmed')}</FormAlert>
        )}

        {active ? (
          <div className="space-y-3">
            {!visit.attendanceConfirmed && (
              <Button size="lg" className="w-full" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
                <ThumbsUp aria-hidden="true" />
                {t('reminder.coming')}
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to={`/patient/appointments/${visit.appointmentId}?action=reschedule`}>
                <CalendarClock aria-hidden="true" />
                {t('reminder.reschedule')}
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                  <XCircle aria-hidden="true" />
                  {t('reminder.cancel')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('reminder.cancelConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('reminder.cancelConfirmBody')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('details.cancelKeep')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cancel.mutate()}>{t('details.cancelConfirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : visit.status !== 'Cancelled' ? (
          <FormAlert tone="info">{t('reminder.notActiveTitle')}</FormAlert>
        ) : null}

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-title-sm text-ink">
            <Info aria-hidden="true" className="size-4 text-primary" />
            {t('reminder.tips')}
          </h2>
          <p className="flex items-start gap-2 text-body-sm text-muted-foreground">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            {t('reminder.tipArrive')}
          </p>
          {visitBranch && (
            <>
              <a href={telHref(visitBranch.phone)} className="flex items-center gap-2 text-body-sm text-primary hover:underline">
                <Phone aria-hidden="true" className="size-4" />
                {t('reminder.tipCall', { branch: branchLabel(visit.branchId) })} <bdi dir="ltr">{formatEgyptianPhone(visitBranch.phone)}</bdi>
              </a>
              <a href={directionsHref(address)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-body-sm text-primary hover:underline">
                <Navigation aria-hidden="true" className="size-4" />
                {t('actions.directions')}
              </a>
            </>
          )}
        </section>
      </div>
    </Frame>
  );
}
