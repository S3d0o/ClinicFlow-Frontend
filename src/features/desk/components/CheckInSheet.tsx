import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { BadgeCheck, Banknote, Clock, IdCard, ShieldCheck, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import { useCheckIn, useCheckInView } from '../hooks/use-desk';
import type { CheckInView } from '../model/desk';

const POLICY_TONE: Record<NonNullable<CheckInView['insurance']>['status'], Tone> = {
  Verified: 'success',
  PendingVerification: 'warning',
  Expired: 'danger',
};

function Section({ step, title, aside, children }: { step: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-title-sm text-ink">
          <span aria-hidden="true" className="inline-flex size-6 items-center justify-center rounded-full bg-ink text-label-sm text-ink-foreground">
            {step}
          </span>
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function CheckInForm({ view, canCollect, onDone }: { view: CheckInView; canCollect: boolean; onDone: () => void }) {
  const { t } = useTranslation('desk');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { specialtyLabel } = useLookups();
  const checkIn = useCheckIn();
  const identityId = useId();
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const { appointment, patient, charges, insurance } = view;
  const money = (amount: number) => formatMoney(amount, language);

  const submit = async (collectNow: boolean) => {
    try {
      const done = await checkIn.mutateAsync(appointment.id);
      toast.success(t('checkIn.done', { name: appointment.patient.fullName, ticket: done.queue?.ticketNo ?? '' }));
      onDone();
      if (collectNow) navigate(`/desk/payments?visit=${appointment.id}`);
    } catch {
      // Shown from checkIn.error below
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-title-sm text-ink"><bdi>{appointment.patient.fullName}</bdi></p>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-label-sm text-secondary-foreground">
              <bdi dir="ltr">{appointment.patient.mrn}</bdi>
            </span>
          </div>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
            <Clock aria-hidden="true" className="size-4" />
            <span>
              {formatDay(appointment.date, language)} · <bdi dir="ltr">{formatWallClock(appointment.startTime, language)}</bdi>
            </span>
          </p>
          <p className="text-body-sm text-muted-foreground">
            {appointment.doctorName} · {specialtyLabel(appointment.specialtyId)}
          </p>
        </div>

        <Section step={1} title={t('checkIn.identity')}>
          <Checkbox
            id={identityId}
            checked={identityConfirmed}
            onChange={(e) => setIdentityConfirmed(e.target.checked)}
            label={t('checkIn.identityConfirm')}
            description={
              patient.nationalId ? (
                <Trans t={t} i18nKey="checkIn.nationalId" values={{ id: patient.nationalId }} components={{ num: <bdi dir="ltr" /> }} />
              ) : (
                t('checkIn.noNationalId')
              )
            }
          />
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-body-sm">
            <span className="flex items-center gap-2">
              <Smartphone aria-hidden="true" className="size-4 text-muted-foreground" />
              <bdi dir="ltr">{formatEgyptianPhone(patient.phone)}</bdi>
            </span>
            {patient.phoneVerified ? (
              <StatusChip tone="success">{t('checkIn.phoneVerified')}</StatusChip>
            ) : (
              <StatusChip tone="neutral">{t('checkIn.phoneUnverified')}</StatusChip>
            )}
          </div>
        </Section>

        <Section step={2} title={t('checkIn.fees')}>
          <dl className="space-y-1.5 text-body-md">
            <div className="flex justify-between gap-3">
              <dt>{t('checkIn.visitFee')}</dt>
              <dd className="tabular-nums">{money(charges.price)}</dd>
            </div>
            {charges.depositPaid > 0 && (
              <div className="flex justify-between gap-3 text-success">
                <dt>{t('checkIn.depositPaid')}</dt>
                <dd className="tabular-nums">− {money(charges.depositPaid)}</dd>
              </div>
            )}
            <div className="flex items-end justify-between gap-3 border-t border-border pt-2">
              <dt className="text-label-md">{t('checkIn.dueAtDesk')}</dt>
              <dd className="font-display text-headline-md tabular-nums text-ink">{money(charges.due)}</dd>
            </div>
          </dl>
          <p className="text-body-sm text-muted-foreground">{t('checkIn.payWhen')}</p>
        </Section>

        <Section
          step={3}
          title={t('checkIn.insurance')}
          aside={insurance && <StatusChip tone={POLICY_TONE[insurance.status]}>{t(`checkIn.policyStatus.${insurance.status}`)}</StatusChip>}
        >
          {insurance ? (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-body-sm">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-0.5">
                <p className="text-label-md text-foreground">
                  {insurance.payerName}
                  {insurance.planName && ` · ${insurance.planName}`}
                </p>
                <p className="text-muted-foreground">
                  <Trans t={t} i18nKey="checkIn.member" values={{ member: insurance.memberNo }} components={{ num: <bdi dir="ltr" /> }} />
                  {insurance.coveragePercent !== undefined && ` · ${t('checkIn.coverage', { percent: insurance.coveragePercent })}`}
                </p>
                <p className="text-muted-foreground">{t('checkIn.validTo', { date: formatDay(insurance.validTo, language, { day: 'numeric', month: 'short', year: 'numeric' }) })}</p>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-muted-foreground">{t('checkIn.noInsurance')}</p>
          )}
        </Section>

        {checkIn.isError && <FormAlert>{errorMessage(checkIn.error)}</FormAlert>}
      </div>

      <SheetFooter className="border-t border-border bg-card">
        <Button type="submit" size="lg" disabled={!identityConfirmed || checkIn.isPending}>
          <BadgeCheck aria-hidden="true" />
          {t('checkIn.submit')}
        </Button>
        {canCollect && charges.due > 0 && (
          <Button type="button" variant="outline" disabled={!identityConfirmed || checkIn.isPending} onClick={() => void submit(true)}>
            <Banknote aria-hidden="true" />
            {t('checkIn.submitAndCollect', { amount: money(charges.due) })}
          </Button>
        )}
        {!identityConfirmed && (
          <p className="flex items-center justify-center gap-1.5 text-center text-caption text-muted-foreground">
            <IdCard aria-hidden="true" className="size-3.5" />
            {t('checkIn.confirmFirst')}
          </p>
        )}
      </SheetFooter>
    </form>
  );
}

interface CheckInSheetProps {
  appointmentId: string | null;
  onClose: () => void;
  /** The user takes payments at this branch. */
  canCollect: boolean;
}

/** The check-in panel (design front-desk/04, FR-FD-03): identity, money and insurance, then the ticket. */
export function CheckInSheet({ appointmentId, onClose, canCollect }: CheckInSheetProps) {
  const { t } = useTranslation('desk');
  const { direction } = useLanguage();
  const view = useCheckInView(appointmentId);

  return (
    <Sheet open={!!appointmentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={direction === 'rtl' ? 'left' : 'right'} className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="pe-12">
          <SheetTitle className="font-display text-headline-md text-ink">{t('checkIn.title')}</SheetTitle>
          <SheetDescription>{t('checkIn.intro')}</SheetDescription>
        </SheetHeader>
        {view.isPending ? (
          <LoadingState />
        ) : view.isError ? (
          <ErrorState onRetry={() => void view.refetch()} />
        ) : (
          <CheckInForm key={view.data.appointment.id} view={view.data} canCollect={canCollect} onDone={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}
