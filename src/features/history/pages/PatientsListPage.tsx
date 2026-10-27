import { useState } from 'react';
import { History, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/hooks/use-session';
import { canAny } from '@/features/auth/model/access';
import { useDoctorDay } from '@/features/doctor/hooks/use-doctor';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { PatientResults } from '@/features/patients/components/PatientResults';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatWallClock } from '@/shared/lib/intl';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { LoadingState } from '@/shared/ui/states';

/** The doctor's own patients today, for a quick jump to their history. */
function TodaysPatients({ today }: { today: string }) {
  const { t } = useTranslation('history');
  const { language } = useLanguage();
  const day = useDoctorDay(today);
  if (day.isPending) return <LoadingState />;
  // A failed load leaves the search usable; Today shows the error with a retry
  if (day.isError) return null;
  const visits = day.data.visits.filter((v) => v.status !== 'Cancelled' && v.status !== 'Rescheduled');
  if (visits.length === 0) return null;
  return (
    <section aria-labelledby="todays-patients" className="space-y-3">
      <h2 id="todays-patients" className="font-display text-headline-md text-ink">{t('list.today')}</h2>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visits.map((visit) => (
          <li key={visit.id}>
            <Link
              to={`/doctor/patients/${visit.patient.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="w-16 shrink-0 text-label-md tabular-nums text-muted-foreground">{formatWallClock(visit.startTime, language)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-md text-ink"><bdi>{visit.patient.fullName}</bdi></span>
                <span className="block text-body-sm text-muted-foreground"><bdi dir="ltr">{visit.patient.mrn}</bdi></span>
              </span>
              <History aria-hidden="true" className="size-4 text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Finding a patient's history (design doctor/03): today's patients first, then search by name, phone or MRN. */
export default function PatientsListPage() {
  const { t } = useTranslation(['history', 'nav']);
  const { user } = useSession();
  const { activeBranch } = useActiveBranch();
  const { today } = useBranchClock(activeBranch);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const isDoctor = canAny(user, ['encounters.write']);

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav:items.doctorPatients')} description={t('list.description')} />
      {isDoctor && <TodaysPatients today={today} />}
      <section aria-labelledby="search-heading" className="space-y-3">
        <h2 id="search-heading" className="font-display text-headline-md text-ink">{t('list.search')}</h2>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('list.searchLabel')}
            placeholder={t('list.searchLabel')}
            className="h-12 w-full rounded-xl border border-input bg-card ps-12 pe-4 text-body-lg outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
        </div>
        <PatientResults
          query={debounced}
          today={today}
          actions={(patient) => (
            <Button asChild size="sm">
              <Link to={`/doctor/patients/${patient.id}`} aria-label={t('list.openFor', { name: patient.fullName })}>
                <History aria-hidden="true" />
                {t('list.open')}
              </Link>
            </Button>
          )}
        />
      </section>
    </div>
  );
}
