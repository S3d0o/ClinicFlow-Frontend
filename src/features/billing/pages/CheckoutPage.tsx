import { useState } from 'react';
import { ArrowLeft, Stethoscope, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { STATUS_TONE } from '@/features/appointments/model/rules';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { BranchRequired } from '@/features/org/components/BranchRequired';
import type { Branch } from '@/features/org/model/branch';
import { TicketBadge } from '@/features/queue/components/TicketBadge';
import { useQueueLive } from '@/features/queue/hooks/use-queue';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatMoney } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { ChargeLines } from '../components/ChargeLines';
import { PaymentPanel } from '../components/PaymentPanel';
import { ReceiptPanel } from '../components/ReceiptPanel';
import { useCheckout, useOpenCheckouts } from '../hooks/use-checkout';
import type { Checkout, Receipt } from '../model/checkout';

function WaitingToPay({ branch, onOpen }: { branch: Branch; onOpen: (appointmentId: string) => void }) {
  const { t } = useTranslation(['billing', 'appointments']);
  const { language } = useLanguage();
  const { serviceLabel } = useLookups();
  const open = useOpenCheckouts(branch.id);

  if (open.isPending) return <LoadingState />;
  if (open.isError) return <ErrorState onRetry={() => void open.refetch()} />;
  if (open.data.length === 0) {
    return <EmptyState className="rounded-2xl border border-dashed border-border" icon={<Wallet aria-hidden="true" className="size-8 text-muted-foreground" />} title={t('list.empty')} />;
  }
  return (
    <section aria-labelledby="waiting-heading" className="space-y-3">
      <h2 id="waiting-heading" className="font-display text-headline-md text-ink">{t('list.title', { count: open.data.length })}</h2>
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {open.data.map((visit) => (
          <li key={visit.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-title-sm text-ink"><bdi>{visit.patient.fullName}</bdi></h3>
                <p className="truncate text-body-sm text-muted-foreground">
                  {visit.doctorName} · {serviceLabel(visit.serviceId)}
                </p>
              </div>
              {visit.queue && <TicketBadge ticket={visit.queue.ticketNo} />}
            </div>
            <div className="flex items-center justify-between gap-2">
              <StatusChip tone={STATUS_TONE[visit.status]}>{t(`appointments:status.${visit.status}`)}</StatusChip>
              <span className="font-display text-headline-md tabular-nums text-ink">{formatMoney(visit.amountDue, language)}</span>
            </div>
            <Button onClick={() => onOpen(visit.id)}>{t('list.take')}</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisitHeader({ checkout }: { checkout: Checkout }) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const { specialtyLabel } = useLookups();
  const { appointment } = checkout;
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-headline-md text-ink"><bdi>{appointment.patient.fullName}</bdi></h2>
          <p className="text-body-sm text-muted-foreground">
            <bdi dir="ltr">{appointment.patient.mrn}</bdi> · <bdi dir="ltr">{formatEgyptianPhone(appointment.patient.phone)}</bdi>
          </p>
        </div>
        {appointment.queue && <TicketBadge ticket={appointment.queue.ticketNo} size="lg" />}
      </div>
      <dl className="grid gap-3 rounded-xl bg-muted/50 p-3 text-body-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">{t('visit.doctor')}</dt>
          <dd className="flex items-center gap-1.5 text-label-md text-foreground">
            <Stethoscope aria-hidden="true" className="size-4 text-primary" />
            {appointment.doctorName}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('visit.specialty')}</dt>
          <dd className="text-label-md text-primary">{specialtyLabel(appointment.specialtyId)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('visit.room')}</dt>
          <dd className="text-label-md text-foreground">{appointment.room ? nameIn(appointment.room, language) : '—'}</dd>
        </div>
      </dl>
    </section>
  );
}

function VisitCheckout({ appointmentId, onBack }: { appointmentId: string; onBack: () => void }) {
  const { t } = useTranslation('billing');
  const { user } = useSession();
  const checkout = useCheckout(appointmentId);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  if (checkout.isPending) return <LoadingState />;
  if (checkout.isError) return <ErrorState onRetry={() => void checkout.refetch()} />;
  const data = checkout.data;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-6">
        <VisitHeader checkout={data} />
        <ChargeLines checkout={data} canEdit={can(user, 'payments.collect', data.appointment.branchId)} />
      </div>
      <div className="space-y-4 lg:sticky lg:top-20">
        {receipt ? (
          <ReceiptPanel receipt={receipt} onPayRest={() => setReceipt(null)} onNext={onBack} />
        ) : data.due > 0 ? (
          <PaymentPanel key={data.due} checkout={data} onPaid={setReceipt} />
        ) : (
          <EmptyState className="rounded-2xl border border-border bg-card" title={t('pay.nothingDue')} description={t('pay.nothingDueBody')} />
        )}
      </div>
    </div>
  );
}

function CheckoutScreen({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['billing', 'screens']);
  const [params, setParams] = useSearchParams();
  const visitId = params.get('visit');
  useQueueLive(branch.id);

  const setVisit = (id: string | null) =>
    setParams((current) => {
      if (id) current.set('visit', id);
      else current.delete('visit');
      return current;
    });

  return (
    <div className="space-y-6">
      <PageHeader title={t('screens:deskCheckout')} description={t('intro')} />
      {visitId ? (
        <>
          <Button variant="link" className="px-0" onClick={() => setVisit(null)}>
            <ArrowLeft aria-hidden="true" className="rtl-flip" />
            {t('list.back')}
          </Button>
          <VisitCheckout key={visitId} appointmentId={visitId} onBack={() => setVisit(null)} />
        </>
      ) : (
        <WaitingToPay branch={branch} onOpen={setVisit} />
      )}
    </div>
  );
}

/** Taking payment at the desk (design front-desk/07, FR-BIL-01/05/07/14): services, deposit, cash or card, receipt. */
export default function CheckoutPage() {
  return <BranchRequired>{(branch) => <CheckoutScreen branch={branch} />}</BranchRequired>;
}
