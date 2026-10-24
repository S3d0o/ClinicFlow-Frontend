import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { priceBreakdown } from '@/features/catalog/model/pricing';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatMoney } from '@/shared/lib/intl';
import { Checkbox } from '@/shared/ui/Checkbox';

interface PriceSummaryProps {
  price: number;
  /** The optional online deposit for the service, if it has one (FR-APT-08). */
  depositAmount?: number;
  payDeposit: boolean;
  onPayDepositChange: (pay: boolean) => void;
}

/** The visit price, an optional deposit to pay online, and what's left for the desk (UX_NOTES U4). */
export function PriceSummary({ price, depositAmount, payDeposit, onPayDepositChange }: PriceSummaryProps) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const id = useId();
  const breakdown = priceBreakdown(price, depositAmount, payDeposit);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4 text-body-md">
      <p className="flex items-center justify-between">
        <span className="text-muted-foreground">{t('booking.price')}</span>
        <span className="font-display text-headline-md text-ink">{formatMoney(breakdown.price, language)}</span>
      </p>
      {depositAmount ? (
        <>
          <Checkbox
            id={`${id}-deposit`}
            checked={payDeposit}
            onChange={(e) => onPayDepositChange(e.target.checked)}
            label={t('booking.deposit', { amount: formatMoney(depositAmount, language) })}
            description={t('booking.depositHint')}
          />
          {payDeposit && (
            <p className="flex items-center justify-between text-body-sm">
              <span className="text-muted-foreground">{t('booking.payNow')}</span>
              <span className="font-semibold">{formatMoney(breakdown.paidNow, language)}</span>
            </p>
          )}
        </>
      ) : null}
      <p className="flex items-center justify-between border-t border-border pt-3 text-body-sm">
        <span className="text-muted-foreground">{t('booking.payAtDesk')}</span>
        <span className="font-semibold">{formatMoney(breakdown.payAtDesk, language)}</span>
      </p>
    </div>
  );
}
