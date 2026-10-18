import type { Gender } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field } from '@/components/form/Field';

export interface PersonalInfoForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePictureUrl: string;
  gender: Gender | '';
  dateOfBirth: string;
}

interface PersonalInfoFieldsProps {
  value: PersonalInfoForm;
  onChange: (value: PersonalInfoForm) => void;
}

/** The personal-information fields shared by the patient and doctor profile pages. */
export function PersonalInfoFields({ value, onChange }: PersonalInfoFieldsProps) {
  const set = (patch: Partial<PersonalInfoForm>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="profile-first-name" label="First name">
        <Input autoComplete="given-name" value={value.firstName} onChange={(e) => set({ firstName: e.target.value })} maxLength={50} />
      </Field>
      <Field id="profile-last-name" label="Last name">
        <Input autoComplete="family-name" value={value.lastName} onChange={(e) => set({ lastName: e.target.value })} maxLength={50} />
      </Field>
      <Field id="profile-phone" label="Phone number" hint="International format, e.g. +201001234567">
        <Input type="tel" autoComplete="tel" value={value.phoneNumber} onChange={(e) => set({ phoneNumber: e.target.value })} />
      </Field>
      <Field id="profile-dob" label="Date of birth">
        <Input type="date" autoComplete="bday" value={value.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
      </Field>
      <div className="space-y-1.5">
        <Label htmlFor="profile-gender" className="text-label-md">Gender</Label>
        <Select value={value.gender} onValueChange={(v) => set({ gender: v as Gender })}>
          <SelectTrigger id="profile-gender" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field id="profile-picture" label="Profile picture URL" optional>
        <Input type="url" inputMode="url" placeholder="https://…" value={value.profilePictureUrl} onChange={(e) => set({ profilePictureUrl: e.target.value })} />
      </Field>
    </div>
  );
}
