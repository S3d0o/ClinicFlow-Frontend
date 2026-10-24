import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquareText, Stethoscope } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fullNativeNameOf, LANGUAGES } from '@/shared/i18n/languages';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { ChoiceCard } from '@/shared/ui/ChoiceCard';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PasswordChecklist } from '@/shared/ui/PasswordChecklist';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { AuthCard } from '../components/AuthCard';
import { FlowProgress } from '../components/FlowProgress';
import { LinkRow } from '../components/LinkRow';
import { useRegister } from '../hooks/use-account-access';
import type { SignUpDraft, VerifyPhoneState } from '../model/flow-state';
import { signUpSchema, type SignUpValues } from '../model/schemas';

/** Patient sign-up with an Egyptian mobile number; email optional (FR-ACC-01). Step 2 verifies the phone. */
export default function SignUpPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const previous = location.state as Partial<VerifyPhoneState> | null;
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const register = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      // FR-ACC-06: the preferred language starts as the UI language
      preferredLanguage: language,
      ...previous?.draft,
      password: '',
      acceptTerms: false,
    },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });

  const onSubmit = form.handleSubmit(async ({ firstName, lastName, phone, email, password: newPassword, preferredLanguage }) => {
    setFormError(null);
    try {
      const ticket = await register.mutateAsync({ firstName, lastName, phone, email: email || undefined, password: newPassword, preferredLanguage });
      const draft: SignUpDraft = { firstName, lastName, phone, email, preferredLanguage };
      navigate('/sign-up/verify', { state: { ticket, from: previous?.from, draft } satisfies VerifyPhoneState });
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <AuthCard
      title={t('signUp.title')}
      intro={t('signUp.intro')}
      after={
        <div className="space-y-4">
          <p className="text-center text-body-md text-muted-foreground">
            {t('signUp.haveAccount')}{' '}
            <Link to="/sign-in" state={previous?.from ? { from: previous.from } : undefined} className="font-semibold text-primary hover:underline">
              {t('common:actions.signIn')}
            </Link>
          </p>
          <LinkRow to="/join" icon={<Stethoscope className="size-4" />} title={t('signUp.doctor')} hint={t('signUp.doctorHint')} />
        </div>
      }
    >
      <FlowProgress step={1} total={2} label={t('signUp.step')} next={t('signUp.next')} />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('signUp.firstName')} error={validation(errors.firstName?.message, { max: 50 })} required>
            {(control) => <Input {...control} {...form.register('firstName')} autoComplete="given-name" placeholder={t('signUp.firstNamePlaceholder')} />}
          </Field>
          <Field label={t('signUp.lastName')} error={validation(errors.lastName?.message, { max: 50 })} required>
            {(control) => <Input {...control} {...form.register('lastName')} autoComplete="family-name" placeholder={t('signUp.lastNamePlaceholder')} />}
          </Field>
        </div>

        <Field
          label={t('signUp.phone')}
          error={validation(errors.phone?.message)}
          required
          hint={
            <span className="inline-flex items-center gap-1.5">
              <MessageSquareText aria-hidden="true" className="size-3.5" />
              {t('signUp.phoneHint')}
            </span>
          }
        >
          {(control) => <PhoneInput {...control} {...form.register('phone')} placeholder="010 1234 5678" />}
        </Field>

        <Field label={t('signUp.password')} error={validation(errors.password?.message)} required>
          {(control) => <PasswordInput {...control} {...form.register('password')} autoComplete="new-password" />}
        </Field>
        <PasswordChecklist password={password} />

        <Field label={t('signUp.email')} hint={t('signUp.emailHint')} error={validation(errors.email?.message)}>
          {(control) => (
            <Input {...control} {...form.register('email')} type="email" autoComplete="email" dir="ltr" className="text-start" placeholder="name@example.com" />
          )}
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-label-md text-foreground">{t('signUp.language')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((option) => (
              <ChoiceCard key={option} value={option} lang={option} {...form.register('preferredLanguage')} label={fullNativeNameOf(option)} />
            ))}
          </div>
        </fieldset>

        <Checkbox id="sign-up-terms" {...form.register('acceptTerms')} label={t('signUp.agree')} error={validation(errors.acceptTerms?.message)} />

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {t('signUp.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
