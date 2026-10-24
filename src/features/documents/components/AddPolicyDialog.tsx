import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FileDrop } from '@/shared/ui/FileDrop';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useAddPolicy, usePayers } from '../hooks/use-documents';
import { CARD_ACCEPT } from '../model/documents';
import { policySchema, type PolicyValues } from '../model/policy.schema';

/** Add an insurance card: insurer, member number, holder, expiry and photos (FR-INS-03). */
export function AddPolicyDialog({ defaultHolder, onClose }: { defaultHolder: string; onClose: () => void }) {
  const { t } = useTranslation(['records', 'common']);
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const payers = usePayers(true);
  const add = useAddPolicy();
  const form = useForm<PolicyValues>({
    resolver: zodResolver(policySchema),
    defaultValues: { payerId: '', memberNo: '', holderName: defaultHolder, validTo: '', cardFront: null, cardBack: null },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async ({ cardFront, cardBack, ...values }) => {
    await add.mutateAsync({ ...values, cardFront: cardFront!, cardBack: cardBack ?? undefined });
    toast.success(t('documents.cardAdded'));
    onClose();
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('documents.addCard')}</DialogTitle>
          <DialogDescription>{t('documents.addCardHint')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e).catch(() => undefined)} noValidate className="space-y-4">
          {add.isError && <FormAlert>{errorMessage(add.error)}</FormAlert>}
          <Field label={t('documents.payer')} error={validation(errors.payerId?.message)} required>
            {(control) => (
              <Controller
                control={form.control}
                name="payerId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id={control.id} aria-invalid={control['aria-invalid']} aria-describedby={control['aria-describedby']} className="w-full">
                      <SelectValue placeholder={t('documents.choosePayer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(payers.data ?? []).map((payer) => (
                        <SelectItem key={payer.id} value={payer.id}>
                          {payer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>
          <Field label={t('documents.memberNo')} error={validation(errors.memberNo?.message, { max: 40 })} required>
            {(control) => <Input {...control} {...form.register('memberNo')} dir="ltr" className="text-start" />}
          </Field>
          <Field label={t('documents.holder')} error={validation(errors.holderName?.message, { max: 100 })} required>
            {(control) => <Input {...control} {...form.register('holderName')} autoComplete="name" />}
          </Field>
          <Field label={t('documents.validTo')} error={validation(errors.validTo?.message)} required>
            {(control) => <Input {...control} {...form.register('validTo')} type="date" />}
          </Field>
          <Field label={t('documents.cardFront')} error={validation(errors.cardFront?.message)} required>
            {(control) => (
              <Controller
                control={form.control}
                name="cardFront"
                render={({ field }) => <FileDrop {...control} file={field.value} onChange={field.onChange} accept={CARD_ACCEPT} hint={t('documents.cardFileHint')} />}
              />
            )}
          </Field>
          <Field label={t('documents.cardBack')} error={validation(errors.cardBack?.message)}>
            {(control) => (
              <Controller
                control={form.control}
                name="cardBack"
                render={({ field }) => <FileDrop {...control} file={field.value} onChange={field.onChange} accept={CARD_ACCEPT} hint={t('documents.cardFileHint')} />}
              />
            )}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t('documents.saveCard')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
