import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useServices } from '@/app/services';
import { useAddEmail } from '@/features/auth/hooks/use-account-access';
import { authKeys } from '@/features/auth/hooks/use-session';
import { emailSchema, type EmailValues } from '@/features/auth/model/schemas';
import type { CurrentUser } from '@/features/auth/model/user';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';

function VerifiedRow({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  const { t } = useTranslation('recruitment');
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground">{label}</p>
        <p dir="ltr" className="truncate text-start text-body-md font-medium text-foreground">
          {value}
        </p>
      </div>
      {verified ? (
        <span className="inline-flex items-center gap-1 text-label-md text-success">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {t('join.verified')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-label-md text-warning">
          <Clock aria-hidden="true" className="size-4" />
          {t('join.notConfirmed')}
        </span>
      )}
    </div>
  );
}

/** Demo only: the link from the confirmation email, coming back to this page afterwards. */
function DemoConfirmLink({ email }: { email: string }) {
  const { t } = useTranslation('recruitment');
  const { demoAccounts } = useServices();
  const { data: path } = useQuery({
    queryKey: ['demo', 'email-link', email],
    queryFn: () => demoAccounts!.latestEmailLink(email),
    enabled: !!demoAccounts,
  });
  if (!path) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={`${path}&next=${encodeURIComponent('/join')}`}>{t('join.demoConfirm')}</Link>
    </Button>
  );
}

/**
 * Step 1 (FR-REC-01): applying needs an account with a verified phone and a confirmed email.
 * Signed-out visitors go to sign-up or sign-in and come back here.
 */
export function AccountStep({ user }: { user: CurrentUser | null }) {
  const { t } = useTranslation(['recruitment', 'common']);
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const queryClient = useQueryClient();
  const addEmail = useAddEmail();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: user?.email ?? '' } });

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-body-md text-muted-foreground">{t('join.signedOutBody')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/sign-up" state={{ from: '/join' }}>
              {t('join.createAccount')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sign-in" state={{ from: '/join' }}>
              {t('join.haveAccount')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingEmail = sentTo ?? (user.email && !user.emailConfirmed ? user.email : null);

  return (
    <div className="space-y-4">
      <VerifiedRow label={t('join.phone')} value={user.phone} verified={user.phoneVerified} />
      {user.email && user.emailConfirmed ? (
        <VerifiedRow label={t('join.email')} value={user.email} verified />
      ) : pendingEmail ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <VerifiedRow label={t('join.email')} value={pendingEmail} verified={false} />
          <p className="text-body-sm text-muted-foreground">
            <Trans t={t} i18nKey="join.linkSent" values={{ email: pendingEmail }} components={{ email: <bdi dir="ltr" className="font-semibold text-foreground" /> }} />
          </p>
          <div className="flex flex-wrap gap-2">
            <DemoConfirmLink email={pendingEmail} />
            <Button type="button" variant="ghost" size="sm" onClick={() => void queryClient.invalidateQueries({ queryKey: authKeys.me })}>
              {t('join.checkAgain')}
            </Button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-3 rounded-xl border border-border p-4"
          onSubmit={form.handleSubmit(({ email }) =>
            addEmail.mutate(email, { onSuccess: () => setSentTo(email.trim()) })
          )}
        >
          {addEmail.isError && <FormAlert>{errorMessage(addEmail.error)}</FormAlert>}
          <Field label={t('join.addEmail')} hint={t('join.addEmailHint')} error={validation(form.formState.errors.email?.message)} required>
            {(control) => <Input {...control} {...form.register('email')} type="email" autoComplete="email" dir="ltr" className="text-start" placeholder="name@example.com" />}
          </Field>
          <Button type="submit" variant="outline" disabled={addEmail.isPending}>
            {t('join.sendLink')}
          </Button>
        </form>
      )}
    </div>
  );
}
