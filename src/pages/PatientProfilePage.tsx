import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { profileApi, patientApi } from '@/api';
import type { UserProfile, PatientProfile, Gender, BloodType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api-error';
import { parseUtc } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Page, PageHeader } from '@/components/layout/Page';
import { ErrorState, LoadingState } from '@/components/states';
import { Field } from '@/components/form/Field';
import { PersonalInfoFields, type PersonalInfoForm } from '@/components/profile/PersonalInfoFields';
import { ProfileSummary } from '@/components/profile/ProfileSummary';
import { HeartPulse, User } from 'lucide-react';
import { toast } from 'sonner';

const bloodTypes: BloodType[] = ['APositive', 'ANegative', 'BPositive', 'BNegative', 'OPositive', 'ONegative', 'ABPositive', 'ABNegative'];
const bloodTypeLabel = (bt: BloodType) => bt.replace('Positive', '+').replace('Negative', '−');

export function PatientProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);

  const [baseForm, setBaseForm] = useState<PersonalInfoForm>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profilePictureUrl: '',
    gender: '',
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
          phoneNumber: profileRes.data.phoneNumber ?? '',
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
        setLoadError(null);
      } catch (err) {
        // Don't show an editable empty form: saving it could blank out real data
        setLoadError(getApiErrorMessage(err, 'Failed to load your profile'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reloadKey]);

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
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update profile'));
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
      toast.success('Medical information updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update medical info'));
    } finally {
      setSavingPatient(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your profile…" className="min-h-[60vh]" />;
  }

  if (loadError) {
    return (
      <Page width="narrow">
        <ErrorState
          title="Couldn’t load your profile"
          message={loadError}
          onRetry={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
        />
      </Page>
    );
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'Your profile';

  return (
    <Page width="narrow">
      <PageHeader title="Profile" description="Keep your contact and health details up to date so your doctors have what they need." />

      <ProfileSummary
        name={fullName}
        email={profile?.email}
        role="Patient"
        memberSince={profile?.createdAt ? format(parseUtc(profile.createdAt), 'MMMM yyyy') : undefined}
      />

      <Tabs defaultValue="personal" className="gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="personal"><User aria-hidden="true" /> Personal</TabsTrigger>
          <TabsTrigger value="medical"><HeartPulse aria-hidden="true" /> Medical</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Your name and contact details as your doctors see them.</CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoFields value={baseForm} onChange={setBaseForm} />
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button onClick={handleSaveBase} disabled={saving}>
                {saving && <Spinner aria-hidden="true" />}
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle>Medical information</CardTitle>
              <CardDescription>Shared with doctors you book, to help them prepare for your visit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="medical-blood-type" className="text-[0.8125rem]">Blood type</Label>
                  <Select value={medicalForm.bloodType} onValueChange={(v) => setMedicalForm({ ...medicalForm, bloodType: v as BloodType })}>
                    <SelectTrigger id="medical-blood-type" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((bt) => (
                        <SelectItem key={bt} value={bt}>{bloodTypeLabel(bt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Field id="medical-allergies" label="Allergies" hint="e.g. Penicillin, peanuts">
                <Textarea rows={2} value={medicalForm.allergies} onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })} maxLength={500} />
              </Field>
              <Field id="medical-chronic" label="Chronic conditions" hint="e.g. Asthma, type 2 diabetes">
                <Textarea rows={2} value={medicalForm.chronicConditions} onChange={(e) => setMedicalForm({ ...medicalForm, chronicConditions: e.target.value })} maxLength={500} />
              </Field>
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold">Emergency contact</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="medical-emergency-name" label="Name">
                    <Input autoComplete="off" value={medicalForm.emergencyContactName} onChange={(e) => setMedicalForm({ ...medicalForm, emergencyContactName: e.target.value })} maxLength={100} />
                  </Field>
                  <Field id="medical-emergency-phone" label="Phone">
                    <Input type="tel" placeholder="+201098765432" value={medicalForm.emergencyContactPhone} onChange={(e) => setMedicalForm({ ...medicalForm, emergencyContactPhone: e.target.value })} />
                  </Field>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button onClick={handleSaveMedical} disabled={savingPatient}>
                {savingPatient && <Spinner aria-hidden="true" />}
                {savingPatient ? 'Saving…' : 'Save changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
