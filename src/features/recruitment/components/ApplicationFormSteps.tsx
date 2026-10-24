import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Specialty } from '@/features/catalog/model/catalog';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useValidationMessage } from '@/shared/i18n/use-messages';
import { formatFileSize } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FileDrop } from '@/shared/ui/FileDrop';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { COVER_LETTER_MAX, type ApplicationValues } from '../model/application.schema';
import { ACCEPT_ATTRIBUTE } from '../model/files';

const NO_PREFERENCE = 'none';

/** Step 2: specialty, license, experience and preferred branch. */
export function PracticeStep({ specialties, branches }: { specialties: Specialty[]; branches: Branch[] }) {
  const { t } = useTranslation('recruitment');
  const { language } = useLanguage();
  const validation = useValidationMessage();
  const { register, control, formState } = useFormContext<ApplicationValues>();
  const { errors } = formState;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={t('join.specialty')} error={validation(errors.specialtyId?.message)} required className="sm:col-span-2">
        {(fieldControl) => (
          <Controller
            control={control}
            name="specialtyId"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id={fieldControl.id} aria-invalid={fieldControl['aria-invalid']} aria-describedby={fieldControl['aria-describedby']} className="w-full">
                  <SelectValue placeholder={t('join.chooseSpecialty')} />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {nameIn(s, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      <Field label={t('join.licenseNo')} error={validation(errors.licenseNo?.message, { max: 50 })} required>
        {(fieldControl) => <Input {...fieldControl} {...register('licenseNo')} dir="ltr" className="text-start" placeholder="MOH-12345" />}
      </Field>
      <Field label={t('join.years')} error={validation(errors.yearsOfExperience?.message, { min: 0, max: 60 })} required>
        {(fieldControl) => <Input {...fieldControl} {...register('yearsOfExperience', { valueAsNumber: true })} type="number" inputMode="numeric" min={0} max={60} />}
      </Field>
      <Field label={t('join.preferredBranch')} className="sm:col-span-2">
        {(fieldControl) => (
          <Controller
            control={control}
            name="preferredBranchId"
            render={({ field }) => (
              <Select value={field.value || NO_PREFERENCE} onValueChange={(value) => field.onChange(value === NO_PREFERENCE ? '' : value)}>
                <SelectTrigger id={fieldControl.id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PREFERENCE}>{t('join.noPreference')}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {branchName(b, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
    </div>
  );
}

/** Step 3: the CV (required) and an optional cover letter, written or uploaded. */
export function DocumentsStep() {
  const { t } = useTranslation('recruitment');
  const validation = useValidationMessage();
  const { register, control, setValue, formState } = useFormContext<ApplicationValues>();
  const { errors } = formState;
  const [mode, text] = useWatch({ control, name: ['coverLetterMode', 'coverLetterText'] });

  return (
    <div className="space-y-6">
      <Field label={t('join.cv')} error={validation(errors.cv?.message)} required>
        {(fieldControl) => (
          <Controller
            control={control}
            name="cv"
            render={({ field }) => <FileDrop {...fieldControl} file={field.value} onChange={field.onChange} accept={ACCEPT_ATTRIBUTE} hint={t('join.fileHint')} />}
          />
        )}
      </Field>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-label-md text-foreground">{t('join.coverLetter')}</legend>
        <div role="group" aria-label={t('join.coverLetterMode')} className="inline-flex rounded-lg border border-border bg-muted p-1">
          {(['text', 'file'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={mode === option}
              onClick={() => setValue('coverLetterMode', option)}
              className={cn(mode === option && 'bg-card text-foreground shadow-xs hover:bg-card')}
            >
              {option === 'text' ? t('join.writeText') : t('join.uploadFile')}
            </Button>
          ))}
        </div>
        {mode === 'text' ? (
          <Field label={t('join.writeText')} error={validation(errors.coverLetterText?.message, { max: COVER_LETTER_MAX })} hint={t('join.characters', { count: text.length, max: COVER_LETTER_MAX })}>
            {(fieldControl) => <Textarea {...fieldControl} {...register('coverLetterText')} rows={6} placeholder={t('join.coverLetterPlaceholder')} />}
          </Field>
        ) : (
          <Field label={t('join.uploadFile')} error={validation(errors.coverLetter?.message)}>
            {(fieldControl) => (
              <Controller
                control={control}
                name="coverLetter"
                render={({ field }) => <FileDrop {...fieldControl} file={field.value} onChange={field.onChange} accept={ACCEPT_ATTRIBUTE} hint={t('join.fileHint')} />}
              />
            )}
          </Field>
        )}
      </fieldset>
    </div>
  );
}

/** Step 4: everything entered, with a way back to each step. */
export function ReviewStep({ specialties, branches, onEdit }: { specialties: Specialty[]; branches: Branch[]; onEdit: (step: number) => void }) {
  const { t } = useTranslation('recruitment');
  const { language } = useLanguage();
  const values = useWatch<ApplicationValues>() as ApplicationValues;
  const specialty = specialties.find((s) => s.id === values.specialtyId);
  const branch = branches.find((b) => b.id === values.preferredBranchId);
  const letter =
    values.coverLetterMode === 'file'
      ? values.coverLetter && `${values.coverLetter.name} · ${formatFileSize(values.coverLetter.size, language)}`
      : values.coverLetterText.trim();

  const rows: { label: string; value: string; step: number }[] = [
    { label: t('join.specialty'), value: specialty ? nameIn(specialty, language) : '', step: 1 },
    { label: t('join.licenseNo'), value: values.licenseNo, step: 1 },
    { label: t('join.years'), value: String(values.yearsOfExperience), step: 1 },
    { label: t('join.preferredBranch'), value: branch ? branchName(branch, language) : t('join.noPreference'), step: 1 },
    { label: t('join.cv'), value: values.cv ? `${values.cv.name} · ${formatFileSize(values.cv.size, language)}` : '', step: 2 },
    { label: t('join.coverLetter'), value: letter || t('join.none'), step: 2 },
  ];

  return (
    <dl className="divide-y divide-border rounded-xl border border-border">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start gap-3 px-4 py-3">
          <dt className="w-40 shrink-0 text-body-sm text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 flex-1 whitespace-pre-line break-words text-body-md text-foreground">{row.value}</dd>
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => onEdit(row.step)}>
            {t('join.edit')}
          </Button>
        </div>
      ))}
    </dl>
  );
}
