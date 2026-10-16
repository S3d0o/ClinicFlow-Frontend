import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api';
import type { Gender, BloodType } from '@/types';
import { getApiErrorMessages } from '@/lib/api-error';
import { meetsPasswordRules } from '@/lib/password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, FieldGroup } from '@/components/form/Field';
import { PasswordInput } from '@/components/form/PasswordInput';
import { PasswordRequirements } from '@/components/form/PasswordRequirements';
import { IconInput } from '@/components/form/IconInput';
import { Mail, MailCheck, Phone } from 'lucide-react';
import { toast } from 'sonner';

const bloodTypes: BloodType[] = ['APositive', 'ANegative', 'BPositive', 'BNegative', 'OPositive', 'ONegative', 'ABPositive', 'ABNegative'];
const bloodTypeLabel = (bt: BloodType) => bt.replace('Positive', '+').replace('Negative', '−');

export function RegisterPatientPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ gender?: string; password?: string }>({});
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: '' as Gender | '',
    dateOfBirth: '',
    bloodType: '' as BloodType | '',
    allergies: '',
    chronicConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Checks the browser can't do on its own (Radix Select ignores `required`)
    const nextErrors = {
      gender: form.gender ? undefined : 'Please select your gender.',
      password: meetsPasswordRules(form.password) ? undefined : 'Your password doesn’t meet all the requirements yet.',
    };
    setErrors(nextErrors);
    if (nextErrors.gender || nextErrors.password) return;

    setLoading(true);
    try {
      await authApi.registerPatient({
        ...form,
        gender: form.gender as Gender,
        bloodType: form.bloodType || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        allergies: form.allergies || undefined,
        chronicConditions: form.chronicConditions || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
      });
      setSuccess(true);
      toast.success('Account created');
    } catch (err) {
      getApiErrorMessages(err, 'Registration failed').forEach((msg) => toast.error(msg));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Check your inbox" description={<>We sent a confirmation link to <strong className="font-semibold text-foreground">{form.email}</strong>.</>}>
        <div className="rounded-xl bg-muted p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MailCheck className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-body-md text-muted-foreground">
            Open the link in the email to confirm your account, then sign in. If it doesn’t arrive within a few minutes, check your spam folder.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Go to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      wide
      title="Create your account"
      description="Book appointments with approved doctors and keep your visits in one place."
      footer={
        <p>
          Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          <span className="mx-2 text-border" aria-hidden="true">|</span>
          Are you a doctor? <Link to="/register/doctor" className="font-semibold text-primary hover:underline">Join as a doctor</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <FieldGroup title="Account">
          <Field id="email" label="Email" required>
            <IconInput icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <div className="space-y-2">
            <Field id="password" label="Password" required error={errors.password}>
              <PasswordInput autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
            <PasswordRequirements id="password-rules" password={form.password} />
          </div>
        </FieldGroup>

        <FieldGroup title="About you">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="firstName" label="First name" required>
              <Input autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required maxLength={50} />
            </Field>
            <Field id="lastName" label="Last name" required>
              <Input autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required maxLength={50} />
            </Field>
            <Field id="phone" label="Phone number" required hint="International format, e.g. +201234567890">
              <IconInput icon={Phone} type="tel" autoComplete="tel" placeholder="+201234567890" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required />
            </Field>
            <Field id="dob" label="Date of birth" optional hint="You must be at least 18.">
              <Input type="date" autoComplete="bday" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </Field>
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="gap-1 text-label-md">
                Gender<span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Select value={form.gender} onValueChange={(v) => { setForm({ ...form, gender: v as Gender }); setErrors((er) => ({ ...er, gender: undefined })); }}>
                <SelectTrigger id="gender" className="w-full" aria-invalid={errors.gender ? true : undefined} aria-describedby={errors.gender ? 'gender-error' : undefined} aria-required>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p id="gender-error" className="text-body-sm font-medium text-destructive">{errors.gender}</p>}
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="Health & emergency contact" description="Optional — you can add or change these later from your profile.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bloodType" className="text-label-md">Blood type</Label>
              <Select value={form.bloodType} onValueChange={(v) => setForm({ ...form, bloodType: v as BloodType })}>
                <SelectTrigger id="bloodType" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((bt) => (
                    <SelectItem key={bt} value={bt}>{bloodTypeLabel(bt)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field id="allergies" label="Allergies">
              <Input placeholder="e.g. Penicillin" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} maxLength={500} />
            </Field>
            <Field id="chronic" label="Chronic conditions" className="sm:col-span-2">
              <Input placeholder="e.g. Asthma" value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} maxLength={500} />
            </Field>
            <Field id="emergencyName" label="Emergency contact name">
              <Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} maxLength={100} />
            </Field>
            <Field id="emergencyPhone" label="Emergency contact phone">
              <IconInput icon={Phone} type="tel" placeholder="+201098765432" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
            </Field>
          </div>
        </FieldGroup>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading && <Spinner aria-hidden="true" />}
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
