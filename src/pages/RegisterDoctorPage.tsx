import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi, specialtiesApi } from '@/api';
import type { Specialty, Gender } from '@/types';
import { getApiErrorMessages } from '@/lib/api-error';
import { meetsPasswordRules } from '@/lib/password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

const BIO_MAX_LENGTH = 500;

export function RegisterDoctorPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ gender?: string; specialty?: string; password?: string }>({});
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: '' as Gender | '',
    dateOfBirth: '',
    specialtyId: '',
    bio: '',
    yearsOfExperience: '',
    consultationFee: '',
    clinicAddress: '',
    clinicCity: '',
  });

  useEffect(() => {
    specialtiesApi.getAll().then((res) => setSpecialties(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Checks the browser can't do on its own (Radix Select ignores `required`)
    const nextErrors = {
      gender: form.gender ? undefined : 'Please select your gender.',
      specialty: form.specialtyId ? undefined : 'Please select your specialty.',
      password: meetsPasswordRules(form.password) ? undefined : 'Your password doesn’t meet all the requirements yet.',
    };
    setErrors(nextErrors);
    if (nextErrors.gender || nextErrors.specialty || nextErrors.password) return;

    setLoading(true);
    try {
      await authApi.registerDoctor({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        gender: form.gender as Gender,
        dateOfBirth: form.dateOfBirth || undefined,
        specialtyId: Number(form.specialtyId),
        bio: form.bio || undefined,
        yearsOfExperience: Number(form.yearsOfExperience),
        consultationFee: Number(form.consultationFee),
        clinicAddress: form.clinicAddress || undefined,
        clinicCity: form.clinicCity || undefined,
      });
      setSuccess(true);
      toast.success('Application submitted');
    } catch (err) {
      getApiErrorMessages(err, 'Registration failed').forEach((msg) => toast.error(msg));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Application submitted" description={<>We sent a confirmation link to <strong className="font-semibold text-foreground">{form.email}</strong>.</>}>
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </span>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><span className="font-semibold text-foreground">1. Confirm your email</span> using the link we just sent.</li>
            <li><span className="font-semibold text-foreground">2. Wait for approval.</span> The clinic team reviews new doctors; you’ll be notified once approved.</li>
            <li><span className="font-semibold text-foreground">3. Set your weekly hours</span> so patients can book you.</li>
          </ol>
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
      title="Join as a doctor"
      description="Create your practice profile. After you confirm your email, the clinic team reviews and approves your account."
      footer={
        <p>
          Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <FieldGroup title="Account">
          <Field id="email" label="Email" required>
            <Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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
            <Field id="phone" label="Phone number" required hint="International format, e.g. +201112223334">
              <Input type="tel" autoComplete="tel" placeholder="+201112223334" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required />
            </Field>
            <Field id="dob" label="Date of birth" optional>
              <Input type="date" autoComplete="bday" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </Field>
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="gap-1 text-[0.8125rem]">
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
              {errors.gender && <p id="gender-error" className="text-xs font-medium text-destructive">{errors.gender}</p>}
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="Your practice" description="This is what patients see on your public profile.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="specialty" className="gap-1 text-[0.8125rem]">
                Specialty<span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Select value={form.specialtyId} onValueChange={(v) => { setForm({ ...form, specialtyId: v }); setErrors((er) => ({ ...er, specialty: undefined })); }}>
                <SelectTrigger id="specialty" className="w-full" aria-invalid={errors.specialty ? true : undefined} aria-describedby={errors.specialty ? 'specialty-error' : undefined} aria-required>
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && <p id="specialty-error" className="text-xs font-medium text-destructive">{errors.specialty}</p>}
            </div>
            <Field id="experience" label="Years of experience" required>
              <Input type="number" inputMode="numeric" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} required min={0} />
            </Field>
            <Field id="fee" label="Consultation fee (EGP)" required hint="Between 1 and 10,000">
              <Input type="number" inputMode="decimal" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} required min={1} max={10000} />
            </Field>
            <Field id="bio" label="Bio" optional className="sm:col-span-2" hint={`${form.bio.length}/${BIO_MAX_LENGTH} — your experience, focus areas and approach to care.`}>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={BIO_MAX_LENGTH} />
            </Field>
            <Field id="address" label="Clinic address" optional>
              <Input autoComplete="street-address" placeholder="Street and building" value={form.clinicAddress} onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })} maxLength={300} />
            </Field>
            <Field id="city" label="City" optional>
              <Input autoComplete="address-level2" value={form.clinicCity} onChange={(e) => setForm({ ...form, clinicCity: e.target.value })} maxLength={100} />
            </Field>
          </div>
        </FieldGroup>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading && <Spinner aria-hidden="true" />}
          {loading ? 'Submitting…' : 'Submit application'}
        </Button>
      </form>
    </AuthLayout>
  );
}
