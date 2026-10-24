import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useServices } from '@/app/services';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { useAddEmail } from '../hooks/use-account-access';
import { authKeys } from '../hooks/use-session';
import { emailSchema, type EmailValues } from '../model/schemas';

/** Demo only: the link from the confirmation email, coming back to `next` afterwards. */
function DemoConfirmLink({ email, next }: { email: string; next: string }) {
  const { t } = useTranslation('auth');
  const { demoAccounts } = useServices();
  const { data: path } = useQuery({
    queryKey: ['demo', 'email-link', email],
    queryFn: () => demoAccounts!.latestEmailLink(email),
    enabled: !!demoAccounts,
  });
  if (!path) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={`${path}&next=${encodeURIComponent(next)}`}>{t('email.demoConfirm')}</Link>
    </Button>
  );
}

interface AddEmailFormProps {
  /** An email that was added but isn't confirmed yet. */
  pendingEmail?: string;
  /** Where the confirmation page's "Continue" should return (demo link only). */
  next: string;
}

/**
 * Add an email (FR-ACC-05): it's used for sign-in and messages once its link is opened. Shows the
 * "we sent a link" state for a pending email.
 */
export function AddEmailForm({ pendingEmail, next }: AddEmailFormProps) {
  const { t } = useTranslation('auth');
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const queryClient = useQueryClient();
  const addEmail = useAddEmail();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });
  const waiting = sentTo ?? pendingEmail;

  if (waiting) {
    return (
      <div className="space-y-3">
        <p className="text-body-sm text-muted-foreground">
          <Trans t={t} i18nKey="email.linkSent" values={{ email: waiting }} components={{ email: <bdi dir="ltr" className="font-semibold text-foreground" /> }} />
        </p>
        <div className="flex flex-wrap gap-2">
          <DemoConfirmLink email={waiting} next={next} />
          <Button type="button" variant="ghost" size="sm" onClick={() => void queryClient.invalidateQueries({ queryKey: authKeys.me })}>
            {t('email.checkAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={form.handleSubmit(({ email }) => addEmail.mutate(email, { onSuccess: () => setSentTo(email.trim()) }))}
    >
      {addEmail.isError && <FormAlert>{errorMessage(addEmail.error)}</FormAlert>}
      <Field label={t('email.add')} hint={t('email.addHint')} error={validation(form.formState.errors.email?.message)} required>
        {(control) => <Input {...control} {...form.register('email')} type="email" autoComplete="email" dir="ltr" className="text-start" placeholder="name@example.com" />}
      </Field>
      <Button type="submit" variant="outline" disabled={addEmail.isPending}>
        {t('email.sendLink')}
      </Button>
    </form>
  );
}
