import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { CheckCircle2, XCircle } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  // A link without its parameters can't be confirmed; no request needed
  const [status, setStatus] = useState<Status>(() => (userId && token ? 'loading' : 'error'));

  const called = useRef(false);

  useEffect(() => {
    if (called.current || !userId || !token) return;
    called.current = true;
    authApi
      .confirmEmail({ userId, token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [userId, token]);

  if (status === 'loading') {
    return (
      <AuthLayout title="Confirming your email…" description="This only takes a moment.">
        <div role="status" className="flex items-center gap-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
          <Spinner className="size-5 text-primary" aria-hidden="true" /> Verifying your confirmation link
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email confirmed" description="Your account is ready. Sign in to book your first appointment.">
        <div role="status" className="rounded-xl border bg-card p-6 shadow-card">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
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
      <div role="alert" className="rounded-xl border bg-card p-6 shadow-card">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">
          Links can only be used once. If you’ve already confirmed your email, you can sign in now.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
