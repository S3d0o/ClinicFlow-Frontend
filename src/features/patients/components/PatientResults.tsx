import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { usePatientSearch } from '../hooks/use-patients';
import type { PatientFilter, PatientSummary } from '../model/patient';
import { PatientCard } from './PatientCard';

interface PatientResultsProps {
  query: string;
  filter?: PatientFilter;
  today: string;
  actions: (patient: PatientSummary) => ReactNode;
  /** Shown when nothing matches, e.g. "register them on the right". */
  emptyHint?: ReactNode;
}

/** Search results with their loading, error and empty states (FR-FD-01). */
export function PatientResults({ query, filter = 'all', today, actions, emptyHint }: PatientResultsProps) {
  const { t } = useTranslation('patients');
  const results = usePatientSearch(query, filter);

  if (query.trim().length < 2) return <p className="rounded-xl bg-muted/60 p-4 text-body-sm text-muted-foreground">{t('search.hint')}</p>;
  if (results.isPending) return <LoadingState />;
  if (results.isError) return <ErrorState onRetry={() => void results.refetch()} />;
  if (results.data.length === 0) {
    return (
      <EmptyState
        className="rounded-xl border border-dashed border-border py-8"
        icon={<SearchX aria-hidden="true" className="size-8 text-muted-foreground" />}
        title={t('search.noMatches')}
        description={emptyHint}
      />
    );
  }
  return (
    <div className="space-y-3">
      <p role="status" className="text-body-sm text-muted-foreground">{t('search.count', { count: results.data.length })}</p>
      <ul className={cn('space-y-3', results.isPlaceholderData && 'opacity-60')}>
        {results.data.map((patient) => (
          <li key={patient.id}>
            <PatientCard patient={patient} today={today} actions={actions(patient)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
