import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { meetsPasswordRules } from '@/lib/password';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/form/Field';
import { PasswordInput } from '@/components/form/PasswordInput';
import { PasswordRequirements } from '@/components/form/PasswordRequirements';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!userId || !token) {
      toast.error('Invalid reset link');
      navigate('/forgot-password');
    }
  }, [userId, token, navigate]);

  // The reset endpoint's policy doesn't require a special character (API contract §5.1 #8)
  const passwordOk = meetsPasswordRules(password, false);
  const mismatch = confirmPassword !== '' && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!passwordOk) return;
    setLoading(true);
    try {
      await authApi.resetPassword({
        userId: userId!,
        token: decodeURIComponent(token!),
        newPassword: password,
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password updated" description="For your security, you’ve been signed out on all devices.">
        <div className="rounded-xl bg-muted p-6" role="status">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-body-md text-muted-foreground">You can now sign in with your new password.</p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" description="Pick something you haven’t used before.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Field id="new-password" label="New password" required error={submitted && !passwordOk ? 'Your password doesn’t meet all the requirements yet.' : null}>
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <PasswordRequirements id="new-password-rules" password={password} requireSpecial={false} />
        </div>
        <Field id="confirm-password" label="Confirm new password" required error={mismatch ? 'Passwords don’t match.' : null}>
          <PasswordInput autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </Field>
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading && <Spinner aria-hidden="true" />}
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
