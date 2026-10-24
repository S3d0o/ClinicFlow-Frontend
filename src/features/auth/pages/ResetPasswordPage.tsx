import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PasswordChecklist } from '@/shared/ui/PasswordChecklist';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { AuthCard } from '../components/AuthCard';
import { FlowProgress } from '../components/FlowProgress';
import { useResetPassword } from '../hooks/use-account-access';
import { lockedPath, readState, type ResetWithCodeState } from '../model/flow-state';
import { newPasswordSchema, type NewPasswordValues } from '../model/schemas';

/**
 * Password recovery, last step (FR-ACC-04). Reached after an SMS code (router state) or from the
 * emailed link (`?email=…&token=…`, API contract §8). Saving signs the user out everywhere.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const reset = useResetPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const viaCode = readState<ResetWithCodeState>(location.state, 'code');
  const email = params.get('email');
  const token = params.get('token');
  const proof = viaCode ?? (email && token ? { email, token } : null);

  const form = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });
  const { errors } = form.formState;
  const [password, confirmPassword] = useWatch({ control: form.control, name: ['password', 'confirmPassword'] });

  if (done) {
    return (
      <AuthCard centered title={t('reset.doneTitle')} intro={t('reset.doneBody')}>
        <CheckCircle2 aria-hidden="true" className="mx-auto mb-6 size-12 text-success" />
        <Button asChild size="lg" className="w-full">
          <Link to="/sign-in" replace>
            {t('common:actions.signIn')}
          </Link>
        </Button>
      </AuthCard>
    );
  }

  if (!proof) {
    return (
      <AuthCard eyebrow={t('reset.eyebrow')} title={t('reset.title')}>
        <FormAlert>{t('reset.incompleteLink')}</FormAlert>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link to="/forgot-password">{t('reset.requestNew')}</Link>
        </Button>
      </AuthCard>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await reset.mutateAsync({ ...proof, password: values.password });
      setDone(true);
    } catch (err) {
      if (isServiceError(err, 'Otp.TooManyAttempts')) navigate(lockedPath(err.details.retryAt), { replace: true });
      else setFormError(errorMessage(err));
    }
  });

  return (
    <AuthCard eyebrow={t('reset.eyebrow')} title={t('reset.title')} intro={t('reset.intro')}>
      {viaCode && <FlowProgress step={3} total={3} label={t('reset.title')} />}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <FormAlert>
            {formError}{' '}
            <Link to="/forgot-password" className="underline">
              {t('reset.requestNew')}
            </Link>
          </FormAlert>
        )}

        <Field label={t('reset.newPassword')} error={validation(errors.password?.message)} required>
          {(control) => <PasswordInput {...control} {...form.register('password')} autoComplete="new-password" autoFocus />}
        </Field>
        <PasswordChecklist password={password} />

        <Field
          label={t('reset.confirmPassword')}
          error={validation(errors.confirmPassword?.message)}
          hint={password && password === confirmPassword ? <span className="text-success">{t('common:password.match')}</span> : undefined}
          required
        >
          {(control) => <PasswordInput {...control} {...form.register('confirmPassword')} autoComplete="new-password" />}
        </Field>

        <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-body-sm text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('reset.signOutNote')}
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {t('reset.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
