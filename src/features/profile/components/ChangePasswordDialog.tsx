import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { newPasswordSchema } from '@/features/auth/model/schemas';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PasswordChecklist } from '@/shared/ui/PasswordChecklist';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { useChangePassword } from '../hooks/use-profile';

const schema = z.object({ currentPassword: z.string().min(1, 'validation.required') }).and(newPasswordSchema);
type Values = z.infer<typeof schema>;

/** The current password, then a new one that meets the policy, typed twice. */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(['profile', 'common']);
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const change = useChangePassword();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', password: '', confirmPassword: '' } });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });

  const onSubmit = form.handleSubmit(({ currentPassword, password: newPassword }) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t('password.saved'));
          onClose();
        },
      }
    )
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('password.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('password.title')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {change.isError && <FormAlert>{errorMessage(change.error)}</FormAlert>}
          <Field label={t('password.current')} error={validation(errors.currentPassword?.message)} required>
            {(control) => <PasswordInput {...control} {...form.register('currentPassword')} autoComplete="current-password" />}
          </Field>
          <Field label={t('password.new')} error={validation(errors.password?.message)} required>
            {(control) => <PasswordInput {...control} {...form.register('password')} autoComplete="new-password" />}
          </Field>
          <PasswordChecklist password={password} />
          <Field label={t('password.confirm')} error={validation(errors.confirmPassword?.message)} required>
            {(control) => <PasswordInput {...control} {...form.register('confirmPassword')} autoComplete="new-password" />}
          </Field>
          <Button type="submit" className="w-full" disabled={change.isPending}>
            {t('password.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
