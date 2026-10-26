import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useAddLine, useRemoveLine } from '../hooks/use-checkout';
import type { Checkout } from '../model/checkout';

/** The billed services with the totals (FR-BIL-01/02/14). Lines change only while the invoice is a draft. */
export function ChargeLines({ checkout, canEdit }: { checkout: Checkout; canEdit: boolean }) {
  const { t } = useTranslation('billing');
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { serviceLabel } = useLookups();
  const add = useAddLine(checkout.appointment.id);
  const remove = useRemoveLine(checkout.appointment.id);
  const [serviceId, setServiceId] = useState('');
  const editable = canEdit && !checkout.invoice;
  const money = (amount: number) => formatMoney(amount, language);

  return (
    <section aria-labelledby="lines-heading" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="lines-heading" className="text-title-sm text-ink">{t('lines.title')}</h2>
          <p className="text-body-sm text-muted-foreground">{checkout.invoice ? t('lines.issued', { number: checkout.invoice.number }) : t('lines.draft')}</p>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-body-md">
          <thead>
            <tr className="border-b border-border text-start text-label-sm uppercase text-muted-foreground">
              <th scope="col" className="py-2 text-start font-semibold">{t('lines.service')}</th>
              <th scope="col" className="py-2 text-end font-semibold">{t('lines.quantity')}</th>
              <th scope="col" className="py-2 text-end font-semibold">{t('lines.unitPrice')}</th>
              <th scope="col" className="py-2 text-end font-semibold">{t('lines.total')}</th>
              {editable && <th scope="col" className="w-10 py-2"><span className="sr-only">{t('lines.actions')}</span></th>}
            </tr>
          </thead>
          <tbody>
            {checkout.lines.map((line) => (
              <tr key={line.id} className="border-b border-border last:border-0">
                <td className="py-3">
                  <span className="block text-foreground">{serviceLabel(line.serviceId)}</span>
                  <span className="text-body-sm text-muted-foreground">{line.booked ? t('lines.booked') : t('lines.added')}</span>
                </td>
                <td className="py-3 text-end tabular-nums">{line.quantity}</td>
                <td className="py-3 text-end tabular-nums">{money(line.unitPrice)}</td>
                <td className="py-3 text-end tabular-nums">{money(line.total)}</td>
                {editable && (
                  <td className="py-3 text-end">
                    {!line.booked && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('lines.remove', { service: serviceLabel(line.serviceId) })}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(line.id)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && checkout.addableServiceIds.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger aria-label={t('lines.addLabel')} className="w-full">
                <SelectValue placeholder={t('lines.addPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {checkout.addableServiceIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {serviceLabel(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            disabled={!serviceId || add.isPending}
            onClick={() => add.mutate(serviceId, { onSuccess: () => setServiceId('') })}
          >
            <Plus aria-hidden="true" />
            {t('lines.add')}
          </Button>
        </div>
      )}
      {(add.isError || remove.isError) && <FormAlert>{errorMessage(add.error ?? remove.error)}</FormAlert>}

      <dl className="space-y-1.5 border-t border-border pt-3 text-body-md">
        <div className="flex justify-between gap-3">
          <dt>{t('totals.subtotal')}</dt>
          <dd className="tabular-nums">{money(checkout.subtotal)}</dd>
        </div>
        {checkout.depositPaid > 0 && (
          <div className="flex justify-between gap-3 text-info">
            <dt>{t('totals.deposit')}</dt>
            <dd className="tabular-nums">− {money(checkout.depositPaid)}</dd>
          </div>
        )}
        {checkout.paidSoFar > 0 && (
          <div className="flex justify-between gap-3 text-success">
            <dt>{t('totals.paidSoFar')}</dt>
            <dd className="tabular-nums">− {money(checkout.paidSoFar)}</dd>
          </div>
        )}
        <div className="flex items-end justify-between gap-3 rounded-xl bg-muted/60 p-3">
          <dt className="text-label-md">{t('totals.due')}</dt>
          <dd className="font-display text-headline-lg tabular-nums text-ink">{money(checkout.due)}</dd>
        </div>
      </dl>
      {checkout.insurance && (
        <p className="text-body-sm text-muted-foreground">
          {checkout.insurance.coveragePercent !== undefined
            ? t('totals.insuranceWithCoverage', { payer: checkout.insurance.payerName, percent: checkout.insurance.coveragePercent })
            : t('totals.insurance', { payer: checkout.insurance.payerName })}
        </p>
      )}
    </section>
  );
}
