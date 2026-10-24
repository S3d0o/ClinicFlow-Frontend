import { useState, type FormEvent, type ReactNode } from 'react';
import { Building2, CalendarDays, Search, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Specialty } from '@/features/catalog/model/catalog';
import type { AvailabilityDay } from '@/features/doctors/api/directory.service';
import { paramsFromSearch } from '@/features/doctors/model/search-params';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ANY = 'any';

interface SearchFieldProps {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SearchField({ id, icon, label, value, onChange, options }: SearchFieldProps) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <span id={id} className="flex items-center gap-1.5 text-label-sm uppercase tracking-[0.06em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-labelledby={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Branch, specialty and day, opening the doctor search with those filters. */
export function AvailabilitySearch({ branches, specialties }: { branches: Branch[]; specialties: Specialty[] }) {
  const { t } = useTranslation(['site', 'doctors']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState(ANY);
  const [specialtyId, setSpecialtyId] = useState(ANY);
  const [day, setDay] = useState(ANY);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = paramsFromSearch({
      branchId: branchId === ANY ? undefined : branchId,
      specialtyId: specialtyId === ANY ? undefined : specialtyId,
      availability: day === ANY ? undefined : (day as AvailabilityDay),
    }).toString();
    navigate(params ? `/doctors?${params}` : '/doctors');
  };

  return (
    <form role="search" aria-label={t('search.label')} onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card md:flex-row md:items-end">
      <SearchField
        id="search-branch"
        icon={<Building2 aria-hidden="true" className="size-3.5" />}
        label={t('search.branch')}
        value={branchId}
        onChange={setBranchId}
        options={[{ value: ANY, label: t('search.anyBranch') }, ...branches.map((b) => ({ value: b.id, label: branchName(b, language) }))]}
      />
      <SearchField
        id="search-specialty"
        icon={<Stethoscope aria-hidden="true" className="size-3.5" />}
        label={t('search.specialty')}
        value={specialtyId}
        onChange={setSpecialtyId}
        options={[{ value: ANY, label: t('search.anySpecialty') }, ...specialties.map((s) => ({ value: s.id, label: nameIn(s, language) }))]}
      />
      <SearchField
        id="search-day"
        icon={<CalendarDays aria-hidden="true" className="size-3.5" />}
        label={t('search.when')}
        value={day}
        onChange={setDay}
        options={[
          { value: ANY, label: t('search.anyTime') },
          { value: 'today', label: t('doctors:find.today') },
          { value: 'tomorrow', label: t('doctors:find.tomorrow') },
          { value: 'week', label: t('doctors:find.week') },
        ]}
      />
      <Button type="submit" size="lg">
        <Search aria-hidden="true" />
        {t('search.submit')}
      </Button>
    </form>
  );
}
