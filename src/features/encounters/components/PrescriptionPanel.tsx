import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Pill, Plus, X } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Allergy } from '@/features/profile/model/profile';
import { useValidationMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { Input } from '@/shared/ui/input';
import { useDrugSearch } from '../hooks/use-encounter';
import type { Drug, PrescriptionItem } from '../model/encounter';
import { prescriptionItemSchema, type PrescriptionItemValues } from '../model/encounter.schema';
import { allergyConflicts, dosageText } from '../model/rules';
import { Panel } from './Panel';

const EMPTY: PrescriptionItemValues = { drugName: '', drugId: '', strength: '', form: '', dose: '', frequency: '', durationDays: '', instructions: '' };

interface PrescriptionPanelProps {
  items: PrescriptionItem[];
  allergies: Allergy[];
  catalog: Drug[];
  readOnly: boolean;
  onChange: (items: PrescriptionItem[]) => void;
}

function AddMedicineForm({ allergies, catalog, onAdd }: { allergies: Allergy[]; catalog: Drug[]; onAdd: (item: PrescriptionItem) => void }) {
  const { t } = useTranslation('encounters');
  const validation = useValidationMessage();
  const form = useForm<PrescriptionItemValues>({ resolver: zodResolver(prescriptionItemSchema), defaultValues: EMPTY });
  const { errors } = form.formState;
  const [drugName, drugId] = useWatch({ control: form.control, name: ['drugName', 'drugId'] });
  const query = useDebouncedValue(drugName);
  const suggestions = useDrugSearch(drugId ? '' : query);
  const conflicts = drugName.trim() ? allergyConflicts({ drugName, drugId: drugId || undefined }, allergies, catalog) : [];

  const pick = (drug: Drug) => {
    form.setValue('drugName', drug.name);
    form.setValue('drugId', drug.id);
    form.setValue('strength', drug.strength);
    form.setValue('form', drug.form);
    form.setFocus('dose');
  };

  const add = form.handleSubmit((values) => {
    onAdd({
      id: crypto.randomUUID(),
      drugName: values.drugName,
      drugId: values.drugId || undefined,
      strength: values.strength || undefined,
      form: values.form || undefined,
      dose: values.dose,
      frequency: values.frequency,
      durationDays: values.durationDays ? Number(values.durationDays) : undefined,
      instructions: values.instructions || undefined,
    });
    form.reset(EMPTY);
  });

  const drugField = form.register('drugName');

  return (
    <form noValidate onSubmit={(event) => void add(event)} className="space-y-3 rounded-xl border border-dashed border-border p-3" aria-label={t('rx.addTitle')}>
      <Field label={t('rx.drug')} hint={t('rx.drugHint')} error={validation(errors.drugName?.message, { max: 100 })} required>
        {(control) => (
          <div className="relative">
            <Input
              {...control}
              {...drugField}
              onChange={(e) => {
                void drugField.onChange(e);
                form.setValue('drugId', '');
              }}
              autoComplete="off"
              dir="auto"
            />
            {!drugId && query.trim().length >= 2 && (suggestions.data?.length ?? 0) > 0 && (
              <ul aria-label={t('rx.suggestions')} className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-card shadow-card">
                {suggestions.data!.map((drug) => (
                  <li key={drug.id}>
                    <button type="button" onClick={() => pick(drug)} className="flex w-full flex-col px-3 py-2 text-start hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
                      <span dir="ltr" className="text-body-md text-foreground">{drug.name} {drug.strength}</span>
                      <span dir="ltr" className="text-body-sm text-muted-foreground">{drug.genericName} · {drug.form}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Field>
      {conflicts.length > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('rx.conflictPreview', { allergies: conflicts.map((a) => a.name).join(', ') })}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('rx.strength')} error={validation(errors.strength?.message, { max: 40 })}>
          {(control) => <Input {...control} {...form.register('strength')} dir="auto" />}
        </Field>
        <Field label={t('rx.form')} error={validation(errors.form?.message, { max: 40 })}>
          {(control) => <Input {...control} {...form.register('form')} dir="auto" />}
        </Field>
        <Field label={t('rx.dose')} hint={t('rx.doseHint')} error={validation(errors.dose?.message, { max: 60 })} required>
          {(control) => <Input {...control} {...form.register('dose')} dir="auto" />}
        </Field>
        <Field label={t('rx.frequency')} hint={t('rx.frequencyHint')} error={validation(errors.frequency?.message, { max: 60 })} required>
          {(control) => <Input {...control} {...form.register('frequency')} dir="auto" />}
        </Field>
        <Field label={t('rx.duration')} error={validation(errors.durationDays?.message, { min: 1, max: 365 })}>
          {(control) => <Input {...control} {...form.register('durationDays')} inputMode="numeric" dir="ltr" />}
        </Field>
        <Field label={t('rx.instructions')} error={validation(errors.instructions?.message, { max: 200 })}>
          {(control) => <Input {...control} {...form.register('instructions')} dir="auto" />}
        </Field>
      </div>
      <Button type="submit" variant="outline" size="sm">
        <Plus aria-hidden="true" />
        {t('rx.add')}
      </Button>
    </form>
  );
}

/** The prescription (FR-EMR-05): catalog or free-text medicines, checked against the allergies; a conflict needs a reason. */
export function PrescriptionPanel({ items, allergies, catalog, readOnly, onChange }: PrescriptionPanelProps) {
  const { t } = useTranslation('encounters');
  const update = (id: string, patch: Partial<PrescriptionItem>) => onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <Panel icon={<Pill className="size-5" />} title={t('rx.title')}>
      {items.length === 0 && <p className="text-body-sm text-muted-foreground">{t('rx.none')}</p>}
      <ol className="space-y-2">
        {items.map((item, index) => {
          const conflicts = allergyConflicts(item, allergies, catalog);
          const acknowledged = !!item.allergyOverrideReason?.trim();
          return (
            <li key={item.id} className={cn('space-y-2 rounded-xl border p-3', conflicts.length && !acknowledged ? 'border-destructive/40' : 'border-border')}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-label-md text-ink">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary text-label-sm text-secondary-foreground">{index + 1}</span>
                    <bdi>{item.drugName}{item.strength && ` ${item.strength}`}</bdi>
                    {item.form && <span className="rounded bg-secondary px-1.5 py-0.5 text-label-sm text-secondary-foreground" dir="auto">{item.form}</span>}
                  </p>
                  <p className="text-body-sm text-foreground">
                    <span dir="auto">{dosageText(item)}</span>
                    {item.durationDays !== undefined && ` · ${t('rx.days', { count: item.durationDays })}`}
                  </p>
                  {item.instructions && <p dir="auto" className="text-body-sm text-muted-foreground">{item.instructions}</p>}
                </div>
                {!readOnly && (
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(items.filter((i) => i.id !== item.id))} aria-label={t('rx.remove', { name: item.drugName })}>
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
              {conflicts.length > 0 && (
                <div className={cn('space-y-2 rounded-lg p-2', acknowledged ? 'bg-warning/10' : 'bg-destructive/10')}>
                  <p className={cn('flex items-start gap-2 text-body-sm font-medium', acknowledged ? 'text-warning' : 'text-destructive')}>
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {t('rx.conflict', { allergies: conflicts.map((a) => a.name).join(', ') })}
                  </p>
                  {readOnly ? (
                    acknowledged && <p dir="auto" className="text-body-sm">{t('rx.overrideReason', { reason: item.allergyOverrideReason })}</p>
                  ) : (
                    <Field label={t('rx.override')} hint={t('rx.overrideHint')}>
                      {(control) => (
                        <Input {...control} value={item.allergyOverrideReason ?? ''} onChange={(e) => update(item.id, { allergyOverrideReason: e.target.value })} maxLength={200} dir="auto" />
                      )}
                    </Field>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!readOnly && <AddMedicineForm allergies={allergies} catalog={catalog} onAdd={(item) => onChange([...items, item])} />}
    </Panel>
  );
}
