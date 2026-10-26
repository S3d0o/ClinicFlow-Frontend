import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { ChoiceCard } from '@/shared/ui/ChoiceCard';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { AuthCard } from '../components/AuthCard';
import { useRequestResetEmail, useSendCode } from '../hooks/use-account-access';
import { lockedPath, type ResetCodeState } from '../model/flow-state';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../model/schemas';

/** There's no real inbox in the demo: show the link the email would carry. */
function DemoEmailLink({ email }: { email: string }) {
  const { t } = useTranslation('auth');
  const { demoAccounts } = useServices();
  const { data: path, isPending } = useQuery({
    queryKey: ['demo', 'email-link', email],
    queryFn: () => demoAccounts!.latestEmailLink(email),
    enabled: !!demoAccounts,
  });
  if (!demoAccounts || isPending) return null;
  return path ? (
    <Button asChild variant="outline" className="w-full">
      <Link to={path}>{t('forgot.demoLink')}</Link>
    </Button>
  ) : (
    <p className="text-center text-body-sm text-muted-foreground">{t('forgot.demoNoEmail')}</p>
  );
}

/** Password recovery, step 1 (FR-ACC-04): a one-time code or an email link. Never reveals whether an account exists. */
export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const sendCode = useSendCode();
  const requestEmail = useRequestResetEmail();
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { channel: 'phone', phone: '', email: '' },
  });
  const { errors } = form.formState;
  const channel = useWatch({ control: form.control, name: 'channel' });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (values.channel === 'phone') {
        const ticket = await sendCode.mutateAsync({ phone: values.phone, purpose: 'PasswordReset' });
        navigate('/forgot-password/verify', { state: { ticket } satisfies ResetCodeState });
      } else {
        await requestEmail.mutateAsync(values.email);
        setEmailSentTo(values.email.trim());
      }
    } catch (err) {
      if (isServiceError(err, 'Otp.TooManyAttempts')) navigate(lockedPath(err.details.retryAt));
      else setFormError(errorMessage(err));
    }
  });

  const signInLink = (
    <p className="text-center text-body-md text-muted-foreground">
      {t('forgot.remember')}{' '}
      <Link to="/sign-in" className="font-semibold text-primary hover:underline">
        {t('common:actions.signIn')}
      </Link>
    </p>
  );

  if (emailSentTo) {
    return (
      <AuthCard eyebrow={t('forgot.eyebrow')} title={t('forgot.emailSentTitle')} after={signInLink}>
        <div className="space-y-5">
          <p className="text-body-md text-muted-foreground">
            <Trans t={t} i18nKey="forgot.emailSentBody" values={{ email: emailSentTo }} components={{ email: <bdi dir="ltr" className="font-semibold text-foreground" /> }} />
          </p>
          <DemoEmailLink email={emailSentTo} />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow={t('forgot.eyebrow')} title={t('forgot.title')} intro={t('forgot.intro')} after={signInLink}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <fieldset className="space-y-3">
          <legend className="sr-only">{t('forgot.channel')}</legend>
          <ChoiceCard value="phone" {...form.register('channel')} icon={<MessageSquareText className="size-5" />} label={t('forgot.phone')} description={t('forgot.phoneHint')} />
          <ChoiceCard value="email" {...form.register('channel')} icon={<Mail className="size-5" />} label={t('forgot.email')} description={t('forgot.emailHint')} />
        </fieldset>

        {channel === 'phone' ? (
          <Field key="phone" label={t('forgot.phoneLabel')} error={validation(errors.phone?.message)} required>
            {(control) => <PhoneInput {...control} {...form.register('phone')} placeholder="010 1234 5678" />}
          </Field>
        ) : (
          <Field key="email" label={t('forgot.emailLabel')} error={validation(errors.email?.message)} required>
            {(control) => (
              <Input {...control} {...form.register('email')} type="email" autoComplete="email" dir="ltr" className="text-start" placeholder="name@example.com" />
            )}
          </Field>
        )}

        <p className="flex items-start gap-2 text-body-sm text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('forgot.privacy')}
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {channel === 'phone' ? t('forgot.submitPhone') : t('forgot.submitEmail')}
        </Button>
      </form>
    </AuthCard>
  );
}
