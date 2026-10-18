import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/form/IconInput';
import { Spinner } from '@/components/ui/spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/form/Field';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage, isRateLimited } from '@/lib/api-error';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      // No email was sent. The limit is per client IP, so saying so reveals nothing about the account
      if (isRateLimited(err)) {
        toast.error(getApiErrorMessage(err, 'Please try again in a moment.'));
        return;
      }
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? 'Check your email' : 'Reset your password'}
      description={sent ? undefined : 'Enter the email you signed up with and we’ll send you a link to choose a new password.'}
      footer={
        <p>
          Remembered it? <Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-xl bg-muted p-6" role="status">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-body-md text-muted-foreground">
            If an account exists for <strong className="font-semibold text-foreground">{email}</strong>, you’ll receive a password reset link shortly. The link can only be used once.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field id="email" label="Email">
            <IconInput icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading && <Spinner aria-hidden="true" />}
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
