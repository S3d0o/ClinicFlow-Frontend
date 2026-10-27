import { zodResolver } from '@hookform/resolvers/zod';
import { FlaskConical, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { Input } from '@/shared/ui/input';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { ClinicalOrder, OrderType } from '../model/encounter';
import { orderSchema, type OrderValues } from '../model/encounter.schema';
import { Panel } from './Panel';

const TYPES: OrderType[] = ['Lab', 'Radiology', 'Referral'];

/** Lab, imaging and referral orders (FR-EMR-07); results come back to the patient's history. */
export function OrdersPanel({ orders, readOnly, onChange }: { orders: ClinicalOrder[]; readOnly: boolean; onChange: (orders: ClinicalOrder[]) => void }) {
  const { t } = useTranslation('encounters');
  const validation = useValidationMessage();
  const form = useForm<OrderValues>({ resolver: zodResolver(orderSchema), defaultValues: { type: 'Lab', description: '' } });

  const add = form.handleSubmit((values) => {
    onChange([...orders, { id: crypto.randomUUID(), type: values.type, description: values.description, status: 'Ordered' }]);
    form.reset({ type: values.type, description: '' });
  });

  return (
    <Panel icon={<FlaskConical className="size-5" />} title={t('orders.title')} aside={orders.length > 0 && <span className="text-caption text-muted-foreground">{t('orders.count', { count: orders.length })}</span>}>
      {orders.length === 0 && <p className="text-body-sm text-muted-foreground">{t('orders.none')}</p>}
      <ul className="space-y-2">
        {orders.map((order) => (
          <li key={order.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
            <StatusChip tone="info">{t(`orders.type.${order.type}`)}</StatusChip>
            <span dir="auto" className="min-w-0 flex-1 text-body-md">{order.description}</span>
            {!readOnly && (
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(orders.filter((o) => o.id !== order.id))} aria-label={t('orders.remove', { name: order.description })}>
                <X aria-hidden="true" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <form noValidate onSubmit={(event) => void add(event)} className="flex flex-wrap items-end gap-2" aria-label={t('orders.addTitle')}>
          <Field label={t('orders.typeLabel')} className="w-36">
            {(control) => (
              <select {...control} {...form.register('type')} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-body-md">
                {TYPES.map((type) => <option key={type} value={type}>{t(`orders.type.${type}`)}</option>)}
              </select>
            )}
          </Field>
          <Field label={t('orders.description')} error={validation(form.formState.errors.description?.message, { max: 200 })} className="min-w-48 flex-1">
            {(control) => <Input {...control} {...form.register('description')} placeholder={t('orders.placeholder')} dir="auto" />}
          </Field>
          <Button type="submit" variant="outline">
            <Plus aria-hidden="true" />
            {t('orders.add')}
          </Button>
        </form>
      )}
    </Panel>
  );
}
