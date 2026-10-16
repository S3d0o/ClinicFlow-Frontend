import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/form/Field';
import { PasswordInput } from '@/components/form/PasswordInput';
import { IconInput } from '@/components/form/IconInput';
import { FormAlert } from '@/components/form/FormAlert';
import { ArrowRight, Mail } from 'lucide-react';
import { toast } from 'sonner';

const homeByRole: Record<string, string> = {
  Admin: '/admin/dashboard',
  Doctor: '/doctor/dashboard',
  Patient: '/patient/appointments',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set by ProtectedRoute (or a "Sign in to book" link) when the user was sent here to sign in
  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const role = localStorage.getItem('userRole') ?? 'Patient';
      navigate(from ?? homeByRole[role] ?? '/', { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Sign in failed. Please try again.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to book visits and manage your appointments. Patients, doctors and clinic staff all sign in here."
      footer={
        <div className="space-y-2">
          <p>
            New to ClinicFlow?{' '}
            <Link to="/register/patient" className="font-semibold text-primary hover:underline">Create a patient account</Link>
          </p>
          <p>
            Are you a doctor?{' '}
            <Link to="/register/doctor" className="font-semibold text-primary hover:underline">Join as a doctor</Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <FormAlert>{error}</FormAlert>}
        <Field id="email" label="Email">
          <IconInput icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-label-md text-foreground">Password</label>
            <Link to="/forgot-password" className="text-label-md text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading && <Spinner aria-hidden="true" />}
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight aria-hidden="true" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
