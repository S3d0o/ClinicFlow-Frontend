import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { profileApi, patientApi } from '@/api';
import type { UserProfile, PatientProfile, Gender, BloodType } from '@/types';
import { useAuth } from '@/context/AuthContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Save, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

export function PatientProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);

  const [baseForm, setBaseForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profilePictureUrl: '',
    gender: '' as Gender | '',
    dateOfBirth: '',
  });

  const [, setPatientProfile] = useState<PatientProfile | null>(null);
  const [medicalForm, setMedicalForm] = useState({
    bloodType: '' as BloodType | '',
    allergies: '',
    chronicConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, patientRes] = await Promise.all([
          profileApi.getMyProfile(),
          patientApi.getProfile(),
        ]);
        setProfile(profileRes.data);
        setPatientProfile(patientRes.data);
        setBaseForm({
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName,
          phoneNumber: profileRes.data.phoneNumber,
          profilePictureUrl: profileRes.data.profilePictureUrl || '',
          gender: profileRes.data.gender,
          dateOfBirth: profileRes.data.dateOfBirth || '',
        });
        setMedicalForm({
          bloodType: patientRes.data.bloodType || '',
          allergies: patientRes.data.allergies || '',
          chronicConditions: patientRes.data.chronicConditions || '',
          emergencyContactName: patientRes.data.emergencyContactName || '',
          emergencyContactPhone: patientRes.data.emergencyContactPhone || '',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handleSaveMedical = async () => {
    setSavingPatient(true);
    try {
      await patientApi.updateProfile({
        bloodType: medicalForm.bloodType || undefined,
        allergies: medicalForm.allergies || undefined,
        chronicConditions: medicalForm.chronicConditions || undefined,
        emergencyContactName: medicalForm.emergencyContactName || undefined,
        emergencyContactPhone: medicalForm.emergencyContactPhone || undefined,
      });
      toast.success('Medical info updated');
    } catch {
      toast.error('Failed to update medical info');
    } finally {
      setSavingPatient(false);
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
            <p className="text-sm text-slate-500">Manage your personal and medical information</p>
          </div>

          {/* Profile Header */}
          <Card className="mb-6 border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20">
                  {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{profile?.firstName} {profile?.lastName}</h2>
                  <p className="text-sm text-teal-600 font-medium">Patient</p>
                  <p className="text-sm text-slate-400">{profile?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full sm:w-auto mb-4">
              <TabsTrigger value="personal" className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Personal</TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Medical</TabsTrigger>
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

            <TabsContent value="medical">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader><CardTitle className="text-lg">Medical Information</CardTitle><CardDescription>Update your health details for better care</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select value={medicalForm.bloodType} onValueChange={(v) => setMedicalForm({ ...medicalForm, bloodType: v as BloodType })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(['APositive', 'ANegative', 'BPositive', 'BNegative', 'OPositive', 'ONegative', 'ABPositive', 'ABNegative'] as BloodType[]).map((bt) => (
                          <SelectItem key={bt} value={bt}>{bt.replace('Positive', '+').replace('Negative', '-')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Allergies</Label><Input value={medicalForm.allergies} onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })} placeholder="e.g., Penicillin" /></div>
                  <div className="space-y-2"><Label>Chronic Conditions</Label><Input value={medicalForm.chronicConditions} onChange={(e) => setMedicalForm({ ...medicalForm, chronicConditions: e.target.value })} placeholder="e.g., Asthma" /></div>
                  <div className="space-y-2"><Label>Emergency Contact Name</Label><Input value={medicalForm.emergencyContactName} onChange={(e) => setMedicalForm({ ...medicalForm, emergencyContactName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Emergency Contact Phone</Label><Input value={medicalForm.emergencyContactPhone} onChange={(e) => setMedicalForm({ ...medicalForm, emergencyContactPhone: e.target.value })} placeholder="+201098765432" /></div>
                  <Button onClick={handleSaveMedical} disabled={savingPatient} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="h-4 w-4 mr-2" /> {savingPatient ? 'Saving...' : 'Save Changes'}
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
