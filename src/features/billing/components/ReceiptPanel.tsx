import { CheckCircle2, Printer, UserRoundCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { useDownloadReceipt } from '../hooks/use-checkout';
import type { Receipt } from '../model/checkout';

interface ReceiptPanelProps {
  receipt: Receipt;
  onPayRest: () => void;
  onNext: () => void;
}

/** After a payment: the change to hand back, the receipt to print, and what's next (FR-BIL-07). */
export function ReceiptPanel({ receipt, onPayRest, onNext }: ReceiptPanelProps) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const download = useDownloadReceipt();
  const money = (amount: number) => formatMoney(amount, language);

  return (
    <section aria-labelledby="receipt-heading" className="space-y-4 rounded-2xl border border-success/30 bg-card p-4 shadow-card sm:p-5">
      <h2 id="receipt-heading" className="flex items-center gap-2 text-title-sm text-success">
        <CheckCircle2 aria-hidden="true" className="size-5" />
        {t('receipt.title')}
      </h2>
      {receipt.change > 0 && (
        <div className="rounded-xl bg-success/10 p-4 text-center text-success">
          <p className="text-label-md">{t('receipt.change')}</p>
          <p className="font-display text-display-md tabular-nums">{money(receipt.change)}</p>
        </div>
      )}
      <dl className="space-y-1.5 text-body-md">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t('receipt.number')}</dt>
          <dd><bdi dir="ltr">{receipt.receiptNo}</bdi></dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t('receipt.invoice')}</dt>
          <dd><bdi dir="ltr">{receipt.invoiceNumber}</bdi></dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t('receipt.paid')}</dt>
          <dd className="tabular-nums">
            {money(receipt.amount)} · {t(`pay.methods.${receipt.method}`)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border pt-1.5">
          <dt className="text-label-md">{t('receipt.remaining')}</dt>
          <dd className="font-semibold tabular-nums">{money(receipt.remaining)}</dd>
        </div>
      </dl>
      {download.isError && <FormAlert>{errorMessage(download.error)}</FormAlert>}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          disabled={download.isPending}
          onClick={() => download.mutate({ paymentId: receipt.paymentId, fileName: `${receipt.receiptNo}.pdf` })}
        >
          <Printer aria-hidden="true" />
          {t('receipt.print')}
        </Button>
        {receipt.remaining > 0 ? (
          <Button onClick={onPayRest}>
            {t('receipt.payRest', { amount: money(receipt.remaining) })}
          </Button>
        ) : (
          <Button onClick={onNext}>
            <UserRoundCheck aria-hidden="true" />
            {t('receipt.next')}
          </Button>
        )}
      </div>
    </section>
  );
}
