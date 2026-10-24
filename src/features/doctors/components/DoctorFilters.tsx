import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Specialty } from '@/features/catalog/model/catalog';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import type { AvailabilityDay, DoctorSearch } from '../api/directory.service';

interface Option {
  value: string;
  label: string;
}

/** A radio group; the empty value means "any". */
function FilterGroup({ legend, name, options, value, onChange, pills }: {
  legend: string;
  name: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  pills?: boolean;
}) {
  return (
    <fieldset className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-2 text-label-md text-foreground">{legend}</legend>
      <div className={pills ? 'grid grid-cols-2 gap-2' : 'space-y-0.5'}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 text-body-md',
              pills
                ? 'justify-center rounded-lg border border-border px-2 py-2 text-label-md has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
                : 'min-h-9 rounded-md px-1 hover:bg-accent'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={pills ? 'sr-only' : 'size-4 accent-primary'}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface DoctorFiltersProps {
  search: DoctorSearch;
  specialties: Specialty[];
  onChange: (change: Partial<DoctorSearch>) => void;
}

/** Specialty, availability and consultation language. Each change applies at once. */
export function DoctorFilters({ search, specialties, onChange }: DoctorFiltersProps) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const id = useId();

  return (
    <div className="space-y-4">
      <FilterGroup
        legend={t('find.specialty')}
        name={`${id}-specialty`}
        value={search.specialtyId ?? ''}
        onChange={(value) => onChange({ specialtyId: value || undefined })}
        options={[{ value: '', label: t('find.anySpecialty') }, ...specialties.map((s) => ({ value: s.id, label: nameIn(s, language) }))]}
      />
      <FilterGroup
        legend={t('find.availability')}
        name={`${id}-day`}
        pills
        value={search.availability ?? ''}
        onChange={(value) => onChange({ availability: (value || undefined) as AvailabilityDay | undefined })}
        options={[
          { value: '', label: t('find.anyTime') },
          { value: 'today', label: t('find.today') },
          { value: 'tomorrow', label: t('find.tomorrow') },
          { value: 'week', label: t('find.week') },
        ]}
      />
      <FilterGroup
        legend={t('find.language')}
        name={`${id}-lang`}
        value={search.language ?? ''}
        onChange={(value) => onChange({ language: value || undefined })}
        options={[
          { value: '', label: t('find.anyLanguage') },
          { value: 'ar', label: t('languages.ar') },
          { value: 'en', label: t('languages.en') },
          { value: 'fr', label: t('languages.fr') },
        ]}
      />
    </div>
  );
}
