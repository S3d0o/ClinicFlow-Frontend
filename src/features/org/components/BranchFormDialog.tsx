import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { useSaveBranch } from '../hooks/use-org-admin';
import type { Branch } from '../model/branch';
import { branchSchema, type BranchValues } from '../model/branch-admin';

const EMPTY: BranchValues = { code: '', nameEn: '', nameAr: '', addressEn: '', addressAr: '', phone: '', timeZone: 'Africa/Cairo' };

interface BranchFormDialogProps {
  /** The branch to edit; none to add one. */
  branch?: Branch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (branch: Branch) => void;
}

/** Adds or edits a branch: code, names, address, phone and time zone (FR-ORG-02, FR-ORG-06). */
export function BranchFormDialog({ branch, open, onOpenChange, onSaved }: BranchFormDialogProps) {
  const { t } = useTranslation(['orgAdmin', 'common']);
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const save = useSaveBranch();
  const form = useForm<BranchValues>({ resolver: zodResolver(branchSchema), defaultValues: EMPTY });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) {
      form.reset(branch ? { ...branch } : EMPTY);
      save.reset();
    }
    // Reset only when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branch]);

  const submit = form.handleSubmit((values) =>
    save.mutate(
      { branchId: branch?.id, input: { ...values, code: values.code.toUpperCase() } },
      {
        onSuccess: (saved) => {
          toast.success(t('branches.saved'));
          onOpenChange(false);
          onSaved?.(saved);
        },
      }
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(branch ? 'branches.editTitle' : 'branches.addTitle')}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
          {save.error && <FormAlert>{errorMessage(save.error)}</FormAlert>}
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <Field label={t('branches.code')} hint={t('branches.codeHint')} error={validation(errors.code?.message)} required>
              {(control) => <Input {...control} {...form.register('code')} dir="ltr" className="uppercase" maxLength={4} />}
            </Field>
            <Field label={t('branches.timeZone')} error={validation(errors.timeZone?.message)} required>
              {(control) => <Input {...control} {...form.register('timeZone')} dir="ltr" />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('branches.nameEn')} error={validation(errors.nameEn?.message, { max: 80 })} required>
              {(control) => <Input {...control} {...form.register('nameEn')} dir="ltr" />}
            </Field>
            <Field label={t('branches.nameAr')} error={validation(errors.nameAr?.message, { max: 80 })} required>
              {(control) => <Input {...control} {...form.register('nameAr')} dir="rtl" />}
            </Field>
            <Field label={t('branches.addressEn')} error={validation(errors.addressEn?.message, { max: 200 })} required>
              {(control) => <Input {...control} {...form.register('addressEn')} dir="ltr" />}
            </Field>
            <Field label={t('branches.addressAr')} error={validation(errors.addressAr?.message, { max: 200 })} required>
              {(control) => <Input {...control} {...form.register('addressAr')} dir="rtl" />}
            </Field>
          </div>
          <Field label={t('branches.phone')} error={validation(errors.phone?.message)} required>
            {(control) => <Input {...control} {...form.register('phone')} type="tel" dir="ltr" />}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
