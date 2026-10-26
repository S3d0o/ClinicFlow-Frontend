import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CalendarPlus, Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { isEgyptianMobile } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { useDuplicates, useRegisterPatient } from '../hooks/use-patients';
import type { PatientSummary } from '../model/patient';
import { registerPatientSchema, type RegisterPatientValues } from '../model/register.schema';
import { PatientCard } from './PatientCard';

interface RegisterPatientFormProps {
  /** The branch's date, for the date of birth limit and ages. */
  today: string;
  onRegistered: (patient: PatientSummary, then: 'stay' | 'book') => void;
  /** Picks an existing record instead of creating a duplicate. */
  onUseExisting: (patient: PatientSummary) => void;
}

const EMPTY: RegisterPatientValues = {
  fullName: '', phone: '', gender: undefined as unknown as RegisterPatientValues['gender'], dateOfBirth: '',
  nationalId: '', emergencyContactName: '', emergencyContactPhone: '',
};

/** Registering a new patient at the desk, warning about likely duplicates while typing (FR-FD-02). */
export function RegisterPatientForm({ today, onRegistered, onUseExisting }: RegisterPatientFormProps) {
  const { t } = useTranslation('patients');
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const register = useRegisterPatient();
  const genderLabelId = useId();
  const form = useForm<RegisterPatientValues>({ resolver: zodResolver(registerPatientSchema(today)), defaultValues: EMPTY });
  const { errors } = form.formState;

  const [fullName, phone, dateOfBirth] = useWatch({ control: form.control, name: ['fullName', 'phone', 'dateOfBirth'] });
  const candidate = useDebouncedValue({
    phone: isEgyptianMobile(phone) ? phone : undefined,
    fullName: fullName.trim() || undefined,
    dateOfBirth: dateOfBirth || undefined,
  });
  const duplicates = useDuplicates(candidate, !!candidate.phone || (!!candidate.fullName && !!candidate.dateOfBirth));
  const matches = duplicates.data ?? [];

  const save = (then: 'stay' | 'book') =>
    form.handleSubmit(async (values) => {
      try {
        const patient = await register.mutateAsync({
          ...values,
          nationalId: values.nationalId || undefined,
          emergencyContactName: values.emergencyContactName || undefined,
          emergencyContactPhone: values.emergencyContactPhone || undefined,
        });
        form.reset(EMPTY);
        onRegistered(patient, then);
      } catch {
        // Shown from register.error below
      }
    });

  return (
    <form noValidate onSubmit={(event) => void save('stay')(event)} className="space-y-4">
      {matches.length > 0 && (
        <section role="status" className="space-y-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <h3 className="flex items-center gap-2 text-title-sm text-warning">
            <AlertTriangle aria-hidden="true" className="size-5" />
            {t('register.duplicateTitle', { count: matches.length })}
          </h3>
          <p className="text-body-sm text-foreground">{t('register.duplicateBody')}</p>
          <ul className="space-y-2">
            {matches.map((match) => (
              <li key={match.id}>
                <PatientCard
                  patient={match}
                  today={today}
                  actions={
                    <Button type="button" size="sm" onClick={() => onUseExisting(match)}>
                      {t('register.useThis')}
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('register.fullName')} hint={t('register.fullNameHint')} error={validation(errors.fullName?.message, { max: 100 })} required>
          {(control) => <Input {...control} {...form.register('fullName')} dir="auto" autoComplete="off" />}
        </Field>
        <Field label={t('register.phone')} error={validation(errors.phone?.message)} required>
          {(control) => <PhoneInput {...control} {...form.register('phone')} placeholder="010 1234 5678" />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset aria-labelledby={genderLabelId} aria-invalid={errors.gender ? true : undefined} className="space-y-1.5">
          <legend id={genderLabelId} className="text-label-md">
            {t('register.gender')}
            <span aria-hidden="true" className="text-destructive">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(['Male', 'Female'] as const).map((gender) => (
              <label
                key={gender}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-body-md has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <input type="radio" value={gender} {...form.register('gender')} className="size-4 accent-primary" />
                {t(`register.genders.${gender}`)}
              </label>
            ))}
          </div>
          {errors.gender && <p className="text-body-sm font-medium text-destructive">{validation(errors.gender.message)}</p>}
        </fieldset>
        <Field label={t('register.dateOfBirth')} error={validation(errors.dateOfBirth?.message)} required>
          {(control) => <Input {...control} {...form.register('dateOfBirth')} type="date" max={today} dir="ltr" className="text-start" />}
        </Field>
      </div>

      <Field label={t('register.nationalId')} hint={t('register.nationalIdHint')} error={validation(errors.nationalId?.message)}>
        {(control) => <Input {...control} {...form.register('nationalId')} inputMode="numeric" maxLength={14} dir="ltr" className="text-start" autoComplete="off" />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('register.emergencyName')} error={validation(errors.emergencyContactName?.message, { max: 100 })}>
          {(control) => <Input {...control} {...form.register('emergencyContactName')} dir="auto" autoComplete="off" />}
        </Field>
        <Field label={t('register.emergencyPhone')} error={validation(errors.emergencyContactPhone?.message)}>
          {(control) => <PhoneInput {...control} {...form.register('emergencyContactPhone')} placeholder="010 1234 5678" />}
        </Field>
      </div>

      {register.isError && <FormAlert>{errorMessage(register.error)}</FormAlert>}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="submit" variant="outline" disabled={register.isPending}>
          <Save aria-hidden="true" />
          {t('register.save')}
        </Button>
        <Button type="button" disabled={register.isPending} onClick={(event) => void save('book')(event)}>
          <CalendarPlus aria-hidden="true" />
          {t('register.saveAndBook')}
        </Button>
      </div>
    </form>
  );
}
