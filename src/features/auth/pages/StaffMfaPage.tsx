import { useState, type FormEvent } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { OtpInput } from '@/shared/ui/OtpInput';
import { toast } from 'sonner';
import { AuthCard } from '../components/AuthCard';
import { useVerifyMfa } from '../hooks/use-sign-in';
import { readState, type MfaState } from '../model/flow-state';

/** Staff sign-in, step 2 (FR-STF-07): the authenticator code, or one of the saved recovery codes. */
export default function StaffMfaPage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const verify = useVerifyMfa();
  const state = readState<MfaState>(location.state, 'challenge');
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!state) return <Navigate to="/sign-in" replace />;
  const { challenge, from } = state;

  const submit = (proof: { code: string } | { recoveryCode: string }) => {
    setError(null);
    verify.mutate(
      { challengeId: challenge.id, proof },
      {
        // Signed in: the route guard opens `from` (kept in this page's state) or the home page
        onError: (err) => {
          if (isServiceError(err, 'Auth.MfaChallengeExpired')) {
            toast.error(errorMessage(err));
            navigate('/sign-in', { replace: true, state: { from } });
            return;
          }
          setError(errorMessage(err));
          setCode('');
        },
      }
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (useRecovery) {
      if (recoveryCode.trim()) submit({ recoveryCode });
      else setError(t('common:validation.required'));
    } else if (code.length === 6) submit({ code });
    else setError(t('common:validation.code'));
  };

  return (
    <AuthCard
      centered
      eyebrow={
        <>
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          {t('mfa.badge')}
        </>
      }
      title={t('mfa.title')}
      intro={useRecovery ? t('mfa.recoveryHint') : t('mfa.intro')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <Avatar name={challenge.identifier} size="sm" />
          <p className="min-w-0 flex-1 truncate text-body-md">
            <span dir="ltr" className="font-medium text-foreground">
              {challenge.identifier}
            </span>
            <span className="text-muted-foreground"> · {t(`common:roles.${challenge.roleLabel}`)}</span>
          </p>
          <Link to="/sign-in" state={{ from }} className="text-label-md text-primary hover:underline">
            {t('mfa.change')}
          </Link>
        </div>

        {error && <FormAlert>{error}</FormAlert>}

        {useRecovery ? (
          <Field label={t('mfa.recoveryLabel')}>
            {(control) => (
              <Input
                {...control}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                autoComplete="one-time-code"
                dir="ltr"
                className="text-center font-mono tracking-widest"
                placeholder="0000-0000"
                autoFocus
              />
            )}
          </Field>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-label-md text-foreground">{t('mfa.codeLabel')}</p>
            <OtpInput value={code} onChange={setCode} onComplete={(value) => submit({ code: value })} invalid={!!error} disabled={verify.isPending} autoFocus />
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={verify.isPending}>
          {t('mfa.submit')}
        </Button>

        <div className="space-y-3 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setUseRecovery((v) => !v);
              setError(null);
            }}
          >
            <KeyRound aria-hidden="true" />
            {useRecovery ? t('mfa.useApp') : t('mfa.useRecovery')}
          </Button>
          <p className="text-body-sm text-muted-foreground">{t('mfa.lost')}</p>
        </div>
      </form>
    </AuthCard>
  );
}
