import { useEffect } from 'react';
import { Building2, Download, Lock, Stethoscope } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { RecordsTabs } from '@/features/records/components/RecordsTabs';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatInstant, formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useDownloadInvoice, useMyInvoices, usePayInvoice } from '../hooks/use-invoices';
import { isOpen, type InvoiceStatus, type PatientInvoice } from '../model/invoice';

const STATUS_TONE: Record<InvoiceStatus, Tone> = { Issued: 'warning', PartiallyPaid: 'warning', Paid: 'success', Void: 'neutral' };

function InvoiceCard({ invoice }: { invoice: PatientInvoice }) {
  const { t } = useTranslation(['records', 'screens']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { branch, branchLabel } = useLookups();
  const pay = usePayInvoice();
  const download = useDownloadInvoice();
  const timeZone = branch(invoice.branchId)?.timeZone ?? 'Africa/Cairo';
  const money = (amount: number) => formatMoney(amount, language);
  const open = isOpen(invoice);

  return (
    <article className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-label-md text-foreground">
            <Trans t={t} i18nKey="invoices.number" values={{ number: invoice.number }} components={{ num: <bdi dir="ltr" /> }} />
          </h2>
          <p className="text-body-sm text-muted-foreground">{formatInstant(invoice.issuedAt, language, timeZone, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <StatusChip tone={STATUS_TONE[invoice.status]}>{t(`invoices.status.${invoice.status}`)}</StatusChip>
      </header>

      <div className="space-y-1 rounded-xl bg-muted/50 p-3 text-body-sm">
        <p className="flex items-center gap-2">
          <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
          {branchLabel(invoice.branchId)}
        </p>
        {invoice.doctorName && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope aria-hidden="true" className="size-4" />
            {t('invoices.doctor', { doctor: invoice.doctorName })}
          </p>
        )}
      </div>

      <dl className="space-y-1.5 text-body-md">
        {invoice.lines.map((line) => (
          <div key={line.description} className="flex justify-between gap-3">
            <dt dir="auto" className="text-start">{line.description}</dt>
            <dd className="tabular-nums">{money(line.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-border pt-1.5 text-body-sm text-muted-foreground">
          <dt>{t('invoices.total')}</dt>
          <dd className="tabular-nums">{money(invoice.total)}</dd>
        </div>
        {invoice.deductions.map((deduction) => (
          <div key={deduction.kind} className="flex justify-between gap-3 text-body-sm text-info">
            <dt>
              {t(`invoices.deduction.${deduction.kind}`)}
              {deduction.label && ` (${deduction.label})`}
            </dt>
            <dd className="tabular-nums">− {money(deduction.amount)}</dd>
          </div>
        ))}
        {invoice.payments.map((payment) => (
          <div key={payment.paidAt} className="flex justify-between gap-3 text-body-sm text-success">
            <dt>
              {t('invoices.paidVia', {
                method: t(`invoices.method.${payment.method}`),
                date: formatInstant(payment.paidAt, language, timeZone, { day: 'numeric', month: 'short' }),
              })}
            </dt>
            <dd className="tabular-nums">− {money(payment.amount)}</dd>
          </div>
        ))}
        {open && (
          <div className="flex items-end justify-between gap-3 rounded-xl border border-border bg-muted/50 p-3">
            <dt className="text-label-md">{t('invoices.balance')}</dt>
            <dd className="font-display text-headline-md text-ink">{money(invoice.balanceDue)}</dd>
          </div>
        )}
      </dl>

      {(pay.isError || download.isError) && <FormAlert>{errorMessage(pay.error ?? download.error)}</FormAlert>}

      {open && invoice.balanceDue > 0 && (
        <div className="space-y-1">
          <Button size="lg" className="w-full" disabled={pay.isPending} onClick={() => pay.mutate(invoice.id)}>
            <Lock aria-hidden="true" />
            {t('invoices.payOnline', { amount: money(invoice.balanceDue) })}
          </Button>
          <p className="text-center text-caption text-muted-foreground">{t('invoices.payMethods')}</p>
        </div>
      )}
      <Button
        variant="outline"
        className="w-full"
        disabled={download.isPending}
        onClick={() => download.mutate({ invoiceId: invoice.id, fileName: `${invoice.number}.pdf` })}
      >
        <Download aria-hidden="true" />
        {invoice.status === 'Paid' ? t('invoices.downloadReceipt') : t('invoices.downloadInvoice')}
      </Button>
    </article>
  );
}

/** Invoices and receipts (design patient/15, FR-PAT-04): what's open, what's paid, pay online, PDFs. */
export default function InvoicesPage() {
  const { t } = useTranslation(['records', 'screens']);
  const invoices = useMyInvoices();
  const [params, setParams] = useSearchParams();

  // Coming back from Paymob's checkout
  const paid = params.get('payment') === 'success';
  useEffect(() => {
    if (!paid) return;
    toast.success(t('invoices.paymentDone'));
    setParams((current) => {
      current.delete('payment');
      return current;
    }, { replace: true });
  }, [paid, setParams, t]);

  const open = (invoices.data ?? []).filter(isOpen);
  const settled = (invoices.data ?? []).filter((i) => !isOpen(i));
  const list = (items: PatientInvoice[], empty: string) =>
    items.length === 0 ? (
      <EmptyState className="rounded-2xl border border-dashed border-border" title={empty} />
    ) : (
      <ul className="space-y-4">
        {items.map((invoice) => (
          <li key={invoice.id}>
            <InvoiceCard invoice={invoice} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="space-y-5">
      <RecordsTabs />
      <PageHeader title={t('screens:invoices')} description={t('invoices.intro')} />
      {invoices.isPending ? (
        <LoadingState />
      ) : invoices.isError ? (
        <ErrorState onRetry={() => void invoices.refetch()} />
      ) : (
        <Tabs defaultValue={open.length ? 'open' : 'paid'} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">{t('invoices.open', { count: open.length })}</TabsTrigger>
            <TabsTrigger value="paid">{t('invoices.paid', { count: settled.length })}</TabsTrigger>
          </TabsList>
          <TabsContent value="open">{list(open, t('invoices.noOpen'))}</TabsContent>
          <TabsContent value="paid">{list(settled, t('invoices.noPaid'))}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
