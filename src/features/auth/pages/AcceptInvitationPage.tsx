import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Clock, Lock } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { formatInstant, formatList } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PasswordChecklist } from '@/shared/ui/PasswordChecklist';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { AuthCard } from '../components/AuthCard';
import type { Invitation } from '../api/auth.service';
import { useAcceptInvitation, useInvitation } from '../hooks/use-staff-access';
import { MFA_SETUP_PATH } from '../model/access';
import { invitationSchema, type InvitationValues } from '../model/schemas';

function InvitationForm({ token, invitation }: { token: string; invitation: Invitation }) {
  const { t } = useTranslation(['auth', 'common']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const validation = useValidationMessage();
  const accept = useAcceptInvitation(token);
  const { data: branches = [] } = useBranches();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InvitationValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { fullName: invitation.fullName, phone: '', password: '', confirmPassword: '', agree: false },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });

  const roleLines = invitation.roles.map((assignment) => {
    const role = t(`common:roles.${assignment.role}`);
    if (assignment.scope === 'Organization') return t('invitation.roleEverywhere', { role });
    const names = branches.filter((b) => assignment.branchIds?.includes(b.id)).map((b) => branchName(b, language));
    return t('invitation.roleAtBranches', { role, branches: formatList(names, language) });
  });

  const onSubmit = form.handleSubmit(async ({ fullName, phone, password: newPassword }) => {
    setFormError(null);
    try {
      await accept.mutateAsync({ fullName, phone, password: newPassword });
      navigate(MFA_SETUP_PATH, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <AuthCard
      eyebrow={t('invitation.eyebrow')}
      title={invitation.invitedByName ? t('invitation.title', { inviter: invitation.invitedByName }) : t('invitation.titleNoInviter')}
      after={<p className="px-2 text-center text-body-sm text-muted-foreground">{t('invitation.wrongDetails')}</p>}
    >
      <div className="mb-6 space-y-2 rounded-xl border border-border bg-muted/50 p-4 text-body-md">
        <p className="flex items-start gap-2">
          <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="text-muted-foreground">{t('invitation.role')}: </span>
            <span className="font-medium text-foreground">{roleLines.join(' · ')}</span>
          </span>
        </p>
        <p className="flex items-center gap-2 text-highlight-strong">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          {t('invitation.expires', {
            date: formatInstant(invitation.expiresAt, language, 'Africa/Cairo', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
          })}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Field label={t('invitation.fullName')} hint={t('invitation.fullNameHint')} error={validation(errors.fullName?.message, { max: 100 })} required>
          {(control) => <Input {...control} {...form.register('fullName')} autoComplete="name" />}
        </Field>

        <Field label={t('invitation.email')} hint={t('invitation.emailHint')}>
          {(control) => (
            // The whole field is left-to-right, so the lock and the padding for it stay on the same side
            <div dir="ltr" className="relative">
              <Input {...control} value={invitation.email} readOnly className="bg-muted pe-10 text-muted-foreground" />
              <Lock aria-hidden="true" className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
        </Field>

        <Field label={t('invitation.phone')} error={validation(errors.phone?.message)} required>
          {(control) => <PhoneInput {...control} {...form.register('phone')} placeholder="010 1234 5678" />}
        </Field>

        <Field label={t('invitation.password')} error={validation(errors.password?.message)} required>
          {(control) => <PasswordInput {...control} {...form.register('password')} autoComplete="new-password" />}
        </Field>
        <PasswordChecklist password={password} />

        <Field label={t('invitation.confirmPassword')} error={validation(errors.confirmPassword?.message)} required>
          {(control) => <PasswordInput {...control} {...form.register('confirmPassword')} autoComplete="new-password" />}
        </Field>

        <Checkbox id="invitation-agree" {...form.register('agree')} label={t('invitation.agree')} error={validation(errors.agree?.message)} />

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {t('invitation.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}

/** A staff member opens their invitation link, sets a password and joins (FR-STF-01, FR-STF-02). */
export default function AcceptInvitationPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { token = '' } = useParams();
  const invitation = useInvitation(token);
  const errorMessage = useErrorMessage();

  if (invitation.isPending) return <LoadingState />;
  if (invitation.isError) {
    return (
      <ErrorState
        title={t('invitation.unusableTitle')}
        description={`${errorMessage(invitation.error)} ${t('invitation.unusableHint')}`}
        action={
          <Button asChild variant="outline">
            <Link to="/">{t('common:notFound.home')}</Link>
          </Button>
        }
      />
    );
  }
  return <InvitationForm token={token} invitation={invitation.data} />;
}
