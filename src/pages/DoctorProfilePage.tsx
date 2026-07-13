import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { profileApi, doctorsApi } from '@/api';
import type { UserProfile, UpdateDoctorProfileRequest, Gender } from '@/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Save, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

export function DoctorProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [baseForm, setBaseForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profilePictureUrl: '',
    gender: '' as Gender | '',
    dateOfBirth: '',
  });

  const [doctorForm, setDoctorForm] = useState<UpdateDoctorProfileRequest>(({
    bio: '',
    consultationFee: 0,
    clinicAddress: '',
    clinicCity: '',
  }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await profileApi.getMyProfile();
        setProfile(profileRes.data);
        setBaseForm({
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName,
          phoneNumber: profileRes.data.phoneNumber,
          profilePictureUrl: profileRes.data.profilePictureUrl || '',
          gender: profileRes.data.gender,
          dateOfBirth: profileRes.data.dateOfBirth || '',
        });
      } catch {
        toast.error('Failed to load profile');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchDoctor = async () => {
      // We need to get the doctor ID from somewhere. For now, let's get it from the user info.
      // Since we don't have a direct endpoint to get the doctor's own profile by ID,
      // we'll use the updateDoctorProfile endpoint which doesn't need the ID.
      // We'll just set some defaults for now.
      setDoctorForm({
        bio: '',
        consultationFee: 0,
        clinicAddress: '',
        clinicCity: '',
      });
    };
    fetchDoctor();
  }, []);

  const handleSaveBase = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({
        firstName: baseForm.firstName,
        lastName: baseForm.lastName,
        phoneNumber: baseForm.phoneNumber,
        profilePictureUrl: baseForm.profilePictureUrl || undefined,
        gender: baseForm.gender as Gender,
        dateOfBirth: baseForm.dateOfBirth || undefined,
      });
      toast.success('Profile updated');
      refreshUser();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDoctor = async () => {
    setSavingDoctor(true);
    try {
      await doctorsApi.updateProfile({
        bio: doctorForm.bio || undefined,
        consultationFee: doctorForm.consultationFee || undefined,
        clinicAddress: doctorForm.clinicAddress || undefined,
        clinicCity: doctorForm.clinicCity || undefined,
      });
      toast.success('Doctor profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to update');
    } finally {
      setSavingDoctor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500">Manage your doctor profile information</p>
          </div>

          <Card className="mb-6 border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20">
                  {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Dr. {profile?.firstName} {profile?.lastName}</h2>
                  <p className="text-sm text-teal-600 font-medium">Doctor</p>
                  <p className="text-sm text-slate-400">{profile?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full sm:w-auto mb-4">
              <TabsTrigger value="personal" className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Personal</TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Professional</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle><CardDescription>Update your basic profile details</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>First Name</Label><Input value={baseForm.firstName} onChange={(e) => setBaseForm({ ...baseForm, firstName: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Last Name</Label><Input value={baseForm.lastName} onChange={(e) => setBaseForm({ ...baseForm, lastName: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Phone Number</Label><Input value={baseForm.phoneNumber} onChange={(e) => setBaseForm({ ...baseForm, phoneNumber: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Profile Picture URL</Label><Input value={baseForm.profilePictureUrl} onChange={(e) => setBaseForm({ ...baseForm, profilePictureUrl: e.target.value })} placeholder="https://..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={baseForm.gender} onValueChange={(v) => setBaseForm({ ...baseForm, gender: v as Gender })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={baseForm.dateOfBirth} onChange={(e) => setBaseForm({ ...baseForm, dateOfBirth: e.target.value })} /></div>
                  </div>
                  <Button onClick={handleSaveBase} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader><CardTitle className="text-lg">Professional Information</CardTitle><CardDescription>Update your practice details</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={doctorForm.bio || ''} onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} placeholder="Tell patients about your experience and expertise..." maxLength={500} />
                  </div>
                  <div className="space-y-2">
                    <Label>Consultation Fee (EGP)</Label>
                    <Input type="number" value={doctorForm.consultationFee || ''} onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: Number(e.target.value) })} min={1} max={10000} />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinic Address</Label>
                    <Input value={doctorForm.clinicAddress || ''} onChange={(e) => setDoctorForm({ ...doctorForm, clinicAddress: e.target.value })} placeholder="Street address..." maxLength={300} />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinic City</Label>
                    <Input value={doctorForm.clinicCity || ''} onChange={(e) => setDoctorForm({ ...doctorForm, clinicCity: e.target.value })} placeholder="City..." maxLength={100} />
                  </div>
                  <Button onClick={handleSaveDoctor} disabled={savingDoctor} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="h-4 w-4 mr-2" /> {savingDoctor ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
