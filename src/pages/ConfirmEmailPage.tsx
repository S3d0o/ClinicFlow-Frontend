import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getApiErrorMessage, isRateLimited } from '@/lib/api-error';

type Status = 'loading' | 'success' | 'error' | 'rateLimited';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  // A link without its parameters can't be confirmed; no request needed
  const [status, setStatus] = useState<Status>(() => (userId && token ? 'loading' : 'error'));
  const [rateLimitMessage, setRateLimitMessage] = useState('');

  const called = useRef(false);

  const confirm = useCallback(() => {
    if (!userId || !token) return;
    authApi
      .confirmEmail({ userId, token })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        // A 429 says nothing about the link (API contract §2.7), so don't call it invalid
        if (isRateLimited(err)) {
          setRateLimitMessage(getApiErrorMessage(err, 'Too many attempts. Please wait a minute and try again.'));
          setStatus('rateLimited');
        } else {
          setStatus('error');
        }
      });
  }, [userId, token]);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    confirm();
  }, [confirm]);

  if (status === 'rateLimited') {
    return (
      <AuthLayout title="Too many attempts" description={rateLimitMessage}>
        <div role="alert" className="rounded-xl bg-muted p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Clock className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-body-md text-muted-foreground">
            Your email hasn't been confirmed yet. Try the same link again once the wait is over.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              setStatus('loading');
              confirm();
            }}
          >
            Try again
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'loading') {
    return (
      <AuthLayout title="Confirming your email…" description="This only takes a moment.">
        <div role="status" className="flex items-center gap-3 rounded-xl bg-muted p-6 text-body-md text-muted-foreground">
          <Spinner className="size-5 text-primary" aria-hidden="true" /> Verifying your confirmation link
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email confirmed" description="Your account is ready. Sign in to book your first appointment.">
        <div role="status" className="rounded-xl bg-muted p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-body-md text-muted-foreground">
            Doctors: your profile becomes visible to patients once the clinic team approves it.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="This link didn’t work" description="The confirmation link is invalid or has expired.">
      <div role="alert" className="rounded-xl bg-muted p-6">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <XCircle className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-body-md text-muted-foreground">
          Links can only be used once. If you’ve already confirmed your email, you can sign in now.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
