import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stethoscope, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { isEgyptianMobile } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { AuthCard } from '../components/AuthCard';
import { DemoAccountsPanel } from '../components/DemoAccountsPanel';
import { LinkRow } from '../components/LinkRow';
import { useSendCode } from '../hooks/use-account-access';
import { useSignIn } from '../hooks/use-sign-in';
import { lockedPath, type MfaState, type VerifyPhoneState } from '../model/flow-state';
import { signInSchema, type SignInValues } from '../model/schemas';

/**
 * One phone-or-email field for everyone (FR-ACC-03, UX_NOTES U6). The account decides what comes
 * next: patients are signed in, staff enter their two-step code. Once signed in, the route guard
 * opens the page the user was going to.
 */
export default function SignInPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const signIn = useSignIn();
  const sendCode = useSendCode();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedIdentifier, setUnverifiedIdentifier] = useState<string | null>(null);

  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { identifier: '', password: '' } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setUnverifiedIdentifier(null);
    try {
      const result = await signIn.mutateAsync(values);
      if (result.status === 'mfa-required') {
        navigate('/sign-in/verify', { state: { challenge: result.challenge, from } satisfies MfaState });
      }
    } catch (err) {
      if (isServiceError(err, 'Auth.AccountLockedOut')) navigate(lockedPath(err.details.retryAt));
      else if (isServiceError(err, 'Auth.PhoneNotVerified')) setUnverifiedIdentifier(values.identifier);
      else setFormError(errorMessage(err));
    }
  });

  const verifyPhone = (phone: string) =>
    sendCode.mutate(
      { phone, purpose: 'SignUp' },
      {
        onSuccess: (ticket) => navigate('/sign-up/verify', { state: { ticket, from } satisfies VerifyPhoneState }),
        onError: (err) => setFormError(errorMessage(err)),
      }
    );

  return (
    <div className="space-y-8">
      <AuthCard
        title={t('signIn.title')}
        intro={t('signIn.intro')}
        after={
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-label-sm uppercase text-muted-foreground" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              {t('signIn.or')}
              <span className="h-px flex-1 bg-border" />
            </div>
            <LinkRow to="/sign-up" state={from ? { from } : undefined} icon={<UserPlus className="size-4" />} title={t('signIn.newPatient')} hint={t('signIn.newPatientHint')} />
            <LinkRow to="/join" icon={<Stethoscope className="size-4" />} title={t('signIn.doctor')} hint={t('signIn.doctorHint')} />
          </div>
        }
      >
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {formError && <FormAlert>{formError}</FormAlert>}
          {unverifiedIdentifier && (
            <FormAlert tone="info">
              <p>{t('signIn.phoneNotVerified')}</p>
              {isEgyptianMobile(unverifiedIdentifier) ? (
                <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={sendCode.isPending} onClick={() => verifyPhone(unverifiedIdentifier)}>
                  {t('signIn.verifyNow')}
                </Button>
              ) : (
                <p className="font-normal">{t('signIn.phoneNotVerifiedUseEmail')}</p>
              )}
            </FormAlert>
          )}

          <Field label={t('signIn.identifier')} error={validation(errors.identifier?.message)} required>
            {(control) => (
              <Input
                {...control}
                {...form.register('identifier')}
                autoComplete="username"
                inputMode="email"
                dir="ltr"
                className="text-start"
                placeholder={t('signIn.identifierPlaceholder')}
              />
            )}
          </Field>

          <Field
            label={t('signIn.password')}
            error={validation(errors.password?.message)}
            required
            labelAside={
              <Link to="/forgot-password" className="text-label-md text-primary hover:underline">
                {t('signIn.forgot')}
              </Link>
            }
          >
            {(control) => <PasswordInput {...control} {...form.register('password')} autoComplete="current-password" />}
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {t('signIn.submit')}
          </Button>
        </form>
      </AuthCard>

      <DemoAccountsPanel />
    </div>
  );
}
