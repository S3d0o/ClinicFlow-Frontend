import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import type { PatientSummary } from '../model/patient';
import { PatientResults } from './PatientResults';

/** Finds the patient a booking is for, or sends the desk to register them first. */
export function PatientPicker({ today, onPick }: { today: string; onPick: (patient: PatientSummary) => void }) {
  const { t } = useTranslation('patients');
  const [text, setText] = useState('');
  const query = useDebouncedValue(text);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={t('search.label')}
          placeholder={t('search.placeholder')}
          className="h-11 w-full rounded-lg border border-input bg-background ps-11 pe-3 text-body-md outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        />
      </div>
      <PatientResults
        query={query}
        today={today}
        actions={(patient) => (
          <Button size="sm" onClick={() => onPick(patient)}>
            {t('actions.select')}
          </Button>
        )}
      />
      <Button asChild variant="link" className="px-0">
        <Link to="/desk/patients">
          <UserPlus aria-hidden="true" />
          {t('actions.registerNew')}
        </Link>
      </Button>
    </div>
  );
}
