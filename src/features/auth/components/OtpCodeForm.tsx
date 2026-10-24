import { useState, type FormEvent } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatSeconds, useCountdown } from '@/shared/lib/use-countdown';
import { Button } from '@/shared/ui/button';
import { OtpInput } from '@/shared/ui/OtpInput';
import type { OtpPurpose, OtpTicket } from '../api/auth.service';
import { useSendCode } from '../hooks/use-account-access';
import { lockedPath } from '../model/flow-state';

interface OtpCodeFormProps {
  ticket: OtpTicket;
  purpose: OtpPurpose;
  submitLabel: string;
  /** Checks the code; reject with a `ServiceError` to show why it failed. */
  onSubmit: (code: string) => Promise<unknown>;
  onTicketChange: (ticket: OtpTicket) => void;
}

/**
 * Enter an SMS code (UX_NOTES U5): auto-submits at six digits, shows tries left after a wrong code,
 * a resend countdown (60 s) and the code's expiry (5 min). Too many tries open the lockout screen.
 */
export function OtpCodeForm({ ticket, purpose, submitLabel, onSubmit, onTicketChange }: OtpCodeFormProps) {
  const { t } = useTranslation(['auth', 'common']);
  const errorMessage = useErrorMessage();
  const navigate = useNavigate();
  const resend = useSendCode();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const resendIn = useCountdown(ticket.resendAt);
  const expiresIn = useCountdown(ticket.expiresAt);
  const expired = expiresIn === 0;

  const submit = async (value: string) => {
    if (value.length !== 6 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(value);
    } catch (err) {
      if (isServiceError(err, 'Otp.TooManyAttempts')) {
        navigate(lockedPath(err.details.retryAt), { replace: true });
        return;
      }
      setError(errorMessage(err));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) setError(t('common:validation.code'));
    else void submit(code);
  };

  const requestNewCode = () => {
    setError(null);
    resend.mutate(
      { phone: ticket.phone, purpose },
      {
        onSuccess: (next) => {
          onTicketChange(next);
          setCode('');
          setNotice(t('verify.resent'));
        },
        onError: (err) => {
          if (isServiceError(err, 'Otp.TooManyAttempts')) navigate(lockedPath(err.details.retryAt), { replace: true });
          else setError(errorMessage(err));
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <p id="otp-label" className="text-label-md text-foreground">
          {t('common:otp.label')}
        </p>
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
          onComplete={(value) => void submit(value)}
          invalid={!!error}
          disabled={submitting || expired}
          autoFocus
          aria-describedby={error ? 'otp-error' : undefined}
        />
      </div>

      {error && (
        <p id="otp-error" role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-body-sm font-medium text-destructive">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="text-body-sm text-success">
          {notice}
        </p>
      )}

      <div className="space-y-2 border-t border-border pt-4 text-body-sm">
        <div className="flex items-center justify-between gap-3">
          {resendIn > 0 ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock aria-hidden="true" className="size-4" />
              {t('verify.resendIn', { time: formatSeconds(resendIn) })}
            </p>
          ) : (
            <span />
          )}
          <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={resendIn > 0 || resend.isPending} onClick={requestNewCode}>
            {t('verify.resend')}
          </Button>
        </div>
        <p aria-live="polite" className={expired ? 'font-medium text-destructive' : 'text-muted-foreground'}>
          {expired ? t('verify.expired') : t('verify.expiresIn', { time: formatSeconds(expiresIn) })}
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting || expired}>
        {submitLabel}
      </Button>
    </form>
  );
}
