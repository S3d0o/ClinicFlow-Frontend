import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi, specialtiesApi } from '@/api';
import type { Specialty, Gender } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterDoctorPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      toast.success('Registration successful!');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
      } else {
        toast.error(err.response?.data?.title || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white py-12 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <Card className="border-teal-200 shadow-lg">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
              <p className="text-sm text-slate-500 mb-2">
                Please check your email <strong>{form.email}</strong> to confirm your account.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                After confirmation, our team will review your application. You will be notified once approved.
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link to="/login">Go to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center bg-gradient-to-b from-teal-50/40 to-white py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">ClinicFlow</span>
          </Link>
        </div>

        <Card className="border-slate-100 shadow-lg shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Join as Doctor</CardTitle>
            <CardDescription>Register your practice and start accepting patients</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required maxLength={50} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Min 8 chars, uppercase, lowercase, digit, special char</p>
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input placeholder="+201112223334" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Gender })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specialty *</Label>
                <Select value={form.specialtyId} onValueChange={(v) => setForm({ ...form, specialtyId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea placeholder="Tell patients about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Experience (years) *</Label>
                  <Input type="number" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} required min={0} />
                </div>
                <div className="space-y-2">
                  <Label>Consultation Fee (EGP) *</Label>
                  <Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} required min={1} max={10000} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Clinic Address</Label>
                <Input placeholder="Street address..." value={form.clinicAddress} onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })} maxLength={300} />
              </div>
              <div className="space-y-2">
                <Label>Clinic City</Label>
                <Input placeholder="City..." value={form.clinicCity} onChange={(e) => setForm({ ...form, clinicCity: e.target.value })} maxLength={100} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/20 h-10">
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Submit Application'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account? <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
