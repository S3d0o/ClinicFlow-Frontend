import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { profileApi, doctorsApi } from '@/api';
import type { UserProfile, Gender } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api-error';
import { parseUtc } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Page, PageHeader } from '@/components/layout/Page';
import { ErrorState, LoadingState } from '@/components/states';
import { Field } from '@/components/form/Field';
import { PersonalInfoFields, type PersonalInfoForm } from '@/components/profile/PersonalInfoFields';
import { ProfileSummary } from '@/components/profile/ProfileSummary';
import { Info, Stethoscope, User } from 'lucide-react';
import { toast } from 'sonner';

// PUT /api/doctors/profile requires consultationFee: > 0 and ≤ 10 000 (API contract §5.3 #13)
const MAX_CONSULTATION_FEE = 10000;
const BIO_MAX_LENGTH = 500;

export function DoctorProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [baseForm, setBaseForm] = useState<PersonalInfoForm>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profilePictureUrl: '',
    gender: '',
    dateOfBirth: '',
  });

  // The API has no endpoint that returns the doctor's own professional details, so this form
  // starts blank. Blank text fields are omitted from the request and keep their current values.
  const [doctorForm, setDoctorForm] = useState({
    bio: '',
    consultationFee: '',
    clinicAddress: '',
    clinicCity: '',
  });

  const feeValue = Number(doctorForm.consultationFee);
  const isFeeValid =
    doctorForm.consultationFee.trim() !== '' && feeValue > 0 && feeValue <= MAX_CONSULTATION_FEE;
  const showFeeError = doctorForm.consultationFee !== '' && !isFeeValid;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await profileApi.getMyProfile();
        setProfile(profileRes.data);
        setBaseForm({
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName,
          phoneNumber: profileRes.data.phoneNumber ?? '',
          profilePictureUrl: profileRes.data.profilePictureUrl || '',
          gender: profileRes.data.gender,
          dateOfBirth: profileRes.data.dateOfBirth || '',
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

  const handleSaveDoctor = async () => {
    if (!isFeeValid) return;
    setSavingDoctor(true);
    try {
      await doctorsApi.updateProfile({
        bio: doctorForm.bio.trim() || undefined,
        consultationFee: feeValue,
        clinicAddress: doctorForm.clinicAddress.trim() || undefined,
        clinicCity: doctorForm.clinicCity.trim() || undefined,
      });
      toast.success('Practice details updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update'));
    } finally {
      setSavingDoctor(false);
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

  const fullName = profile ? `Dr. ${profile.firstName} ${profile.lastName}` : 'Your profile';

  return (
    <Page width="narrow">
      <PageHeader title="Profile" description="Manage your personal details and how your practice appears to patients." />

      <ProfileSummary
        name={fullName}
        email={profile?.email}
        role="Doctor"
        memberSince={profile?.createdAt ? format(parseUtc(profile.createdAt), 'MMMM yyyy') : undefined}
      />

      <Tabs defaultValue="personal" className="gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="personal"><User aria-hidden="true" /> Personal</TabsTrigger>
          <TabsTrigger value="professional"><Stethoscope aria-hidden="true" /> Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Your name and contact details.</CardDescription>
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

        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Practice details</CardTitle>
              <CardDescription>Shown to patients on your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/[0.06] px-4 py-3 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
                <p className="text-foreground/85">
                  Fields you leave blank keep their current values. The consultation fee is required each time you save.
                </p>
              </div>
              <Field
                id="doctor-fee"
                label="Consultation fee (EGP)"
                required
                hint={`More than 0 and at most ${MAX_CONSULTATION_FEE.toLocaleString()} EGP.`}
                error={showFeeError ? `Enter a fee between 1 and ${MAX_CONSULTATION_FEE.toLocaleString()} EGP.` : null}
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  value={doctorForm.consultationFee}
                  onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                  min={1}
                  max={MAX_CONSULTATION_FEE}
                  className="sm:max-w-[12rem]"
                />
              </Field>
              <Field id="doctor-bio" label="Bio" hint={`${doctorForm.bio.length}/${BIO_MAX_LENGTH} — your experience, focus areas and approach to care.`}>
                <Textarea rows={4} value={doctorForm.bio} onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} maxLength={BIO_MAX_LENGTH} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field id="doctor-address" label="Clinic address">
                  <Input autoComplete="street-address" placeholder="Street and building" value={doctorForm.clinicAddress} onChange={(e) => setDoctorForm({ ...doctorForm, clinicAddress: e.target.value })} maxLength={300} />
                </Field>
                <Field id="doctor-city" label="City">
                  <Input autoComplete="address-level2" value={doctorForm.clinicCity} onChange={(e) => setDoctorForm({ ...doctorForm, clinicCity: e.target.value })} maxLength={100} />
                </Field>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button onClick={handleSaveDoctor} disabled={savingDoctor || !isFeeValid}>
                {savingDoctor && <Spinner aria-hidden="true" />}
                {savingDoctor ? 'Saving…' : 'Save practice details'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
