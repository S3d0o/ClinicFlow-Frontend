import { useState, type FormEvent } from 'react';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { ChoiceCard } from '@/shared/ui/ChoiceCard';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { useCollect, useCurrentCashSession } from '../hooks/use-checkout';
import { changeDue, DESK_METHODS, quickAmounts, type Checkout, type DeskPaymentMethod, type Receipt } from '../model/checkout';

const ICONS: Record<DeskPaymentMethod, typeof Banknote> = { Cash: Banknote, Card: CreditCard, Wallet: Smartphone };

/** "350" or "350.5" → a number; anything else → NaN. */
const parseAmount = (text: string) => (/^\d+(\.\d{1,2})?$/.test(text.trim()) ? Number(text.trim()) : Number.NaN);

/** Choosing how the patient pays and taking the money (FR-BIL-05): cash with change, card or wallet. */
export function PaymentPanel({ checkout, onPaid }: { checkout: Checkout; onPaid: (receipt: Receipt) => void }) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const session = useCurrentCashSession();
  const collect = useCollect(checkout.appointment.id);
  const [method, setMethod] = useState<DeskPaymentMethod>('Cash');
  const [amountText, setAmountText] = useState(String(checkout.due));
  const [tenderedText, setTenderedText] = useState('');
  const [reference, setReference] = useState('');
  const money = (amount: number) => formatMoney(amount, language);

  const amount = parseAmount(amountText);
  const tendered = parseAmount(tenderedText);
  const amountError = Number.isNaN(amount) || amount <= 0 || amount > checkout.due ? t('pay.amountInvalid', { max: money(checkout.due) }) : null;
  const tenderedError = method === 'Cash' && tenderedText && (Number.isNaN(tendered) || tendered < amount) ? t('pay.tenderedShort') : null;
  const sessionHere = session.data?.branchId === checkout.appointment.branchId;
  const needsSession = method === 'Cash' && !session.isPending && !sessionHere;
  const change = method === 'Cash' && !tenderedError && tenderedText ? changeDue(tendered, amount) : 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (amountError || tenderedError || needsSession) return;
    try {
      const receipt = await collect.mutateAsync({
        method,
        amount,
        tendered: method === 'Cash' && tenderedText ? tendered : undefined,
        reference: method !== 'Cash' ? reference : undefined,
      });
      onPaid(receipt);
    } catch {
      // Shown from collect.error below
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <h2 className="text-title-sm text-ink">{t('pay.title')}</h2>
      <fieldset className="space-y-2">
        <legend className="sr-only">{t('pay.method')}</legend>
        {DESK_METHODS.map((option) => {
          const Icon = ICONS[option];
          return (
            <ChoiceCard
              key={option}
              name="method"
              value={option}
              checked={method === option}
              onChange={() => setMethod(option)}
              icon={<Icon className="size-5" />}
              label={t(`pay.methods.${option}`)}
              description={t(`pay.methodHints.${option}`)}
            />
          );
        })}
      </fieldset>

      {needsSession && (
        <FormAlert tone="info">
          {t('pay.noSession')}{' '}
          <Link to="/desk/cash" className="font-semibold underline">
            {t('pay.openSession')}
          </Link>
        </FormAlert>
      )}

      <Field label={t('pay.amount')} hint={t('pay.amountHint')} error={amountText && amountError ? amountError : undefined} required>
        {(control) => (
          <Input {...control} value={amountText} onChange={(e) => setAmountText(e.target.value)} inputMode="decimal" dir="ltr" className="text-start tabular-nums" />
        )}
      </Field>

      {method === 'Cash' ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
          <Field label={t('pay.tendered')} error={tenderedError ?? undefined}>
            {(control) => (
              <Input {...control} value={tenderedText} onChange={(e) => setTenderedText(e.target.value)} inputMode="decimal" dir="ltr" className="text-start tabular-nums" />
            )}
          </Field>
          {!amountError && (
            <div role="group" aria-label={t('pay.quickFill')} className="flex flex-wrap gap-2">
              {quickAmounts(amount).map((quick) => (
                <Button
                  key={quick}
                  type="button"
                  size="sm"
                  variant={tenderedText === String(quick) ? 'strong' : 'outline'}
                  onClick={() => setTenderedText(String(quick))}
                >
                  {money(quick)}
                </Button>
              ))}
            </div>
          )}
          <div className={cn('flex items-center justify-between rounded-lg px-3 py-2', change > 0 ? 'bg-success/10 text-success' : 'bg-card text-muted-foreground')}>
            <span className="text-label-md">{t('pay.change')}</span>
            <span role="status" className="font-display text-headline-md tabular-nums">{money(change)}</span>
          </div>
        </div>
      ) : (
        <Field label={t('pay.reference')} hint={t('pay.referenceHint')}>
          {(control) => <Input {...control} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={40} dir="ltr" className="text-start" />}
        </Field>
      )}

      {collect.isError && <FormAlert>{errorMessage(collect.error)}</FormAlert>}
      <Button type="submit" size="lg" className="w-full" disabled={!!amountError || !!tenderedError || needsSession || collect.isPending}>
        {t('pay.submit', { amount: amountError ? money(checkout.due) : money(amount) })}
      </Button>
    </form>
  );
}
