import { useEffect, useState } from 'react';
import { CalendarPlus, Footprints, Search, UserPlus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { PageHeader } from '@/shared/ui/PageHeader';
import { PatientResults } from '../components/PatientResults';
import { RegisterPatientForm } from '../components/RegisterPatientForm';
import type { PatientFilter, PatientSummary } from '../model/patient';

const FILTERS: PatientFilter[] = ['all', 'balance', 'insured'];

/** Find a patient or register a new one (design front-desk/02, FR-FD-01/02). The top bar's search opens here. */
export default function PatientsPage() {
  const { t } = useTranslation(['patients', 'screens']);
  const navigate = useNavigate();
  const { user } = useSession();
  const { activeBranch, activeBranchId } = useActiveBranch();
  const { today } = useBranchClock(activeBranch);
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState<PatientFilter>('all');
  const query = useDebouncedValue(text);

  // The search is kept in the URL (`q`), so the top bar's search can open this page with it. A new
  // `q` that isn't this page's own (typed text written back below) replaces what's in the box.
  const urlQuery = params.get('q') ?? '';
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    if (urlQuery !== query) setText(urlQuery);
  }

  useEffect(() => {
    if (query === urlQuery) return;
    setParams((current) => {
      if (query) current.set('q', query);
      else current.delete('q');
      return current;
    }, { replace: true });
  }, [query, urlQuery, setParams]);

  const canBook = can(user, 'appointments.book_on_behalf', activeBranchId ?? undefined);
  const canWalkIn = can(user, 'appointments.check_in', activeBranchId ?? undefined);
  const canRegister = can(user, 'patients.register', activeBranchId ?? undefined);

  const bookFor = (patient: PatientSummary, mode?: 'walk-in') =>
    navigate(`/desk/book?patient=${patient.id}${mode ? `&mode=${mode}` : ''}`);

  const registered = (patient: PatientSummary, then: 'stay' | 'book') => {
    toast.success(t('register.done', { name: patient.fullName, mrn: patient.mrn }));
    if (then === 'book') bookFor(patient);
    else setText(patient.mrn);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('screens:deskPatients')} description={t('intro')} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="search-heading" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 id="search-heading" className="flex items-center gap-2 text-title-sm text-ink">
            <Search aria-hidden="true" className="size-5 text-primary" />
            {t('search.title')}
          </h2>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label={t('search.label')}
              placeholder={t('search.placeholder')}
              autoFocus
              className="h-12 w-full rounded-lg border-2 border-primary/40 bg-background ps-11 pe-3 text-body-lg outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>
          <FilterChips
            label={t('search.filterLabel')}
            options={FILTERS.map((value) => ({ value, label: t(`search.filters.${value}`) }))}
            value={filter}
            onChange={setFilter}
          />
          <PatientResults
            query={query}
            filter={filter}
            today={today}
            emptyHint={canRegister ? t('search.registerHint') : undefined}
            actions={(patient) => (
              <>
                {canBook && (
                  <Button size="sm" onClick={() => bookFor(patient)}>
                    <CalendarPlus aria-hidden="true" />
                    {t('actions.book')}
                  </Button>
                )}
                {canWalkIn && (
                  <Button size="sm" variant="outline" onClick={() => bookFor(patient, 'walk-in')}>
                    <Footprints aria-hidden="true" />
                    {t('actions.walkIn')}
                  </Button>
                )}
              </>
            )}
          />
        </section>

        {canRegister && (
          <section aria-labelledby="register-heading" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div>
              <h2 id="register-heading" className="flex items-center gap-2 font-display text-headline-md text-ink">
                <UserPlus aria-hidden="true" className="size-5 text-primary" />
                {t('register.title')}
              </h2>
              <p className="text-body-sm text-muted-foreground">{t('register.intro')}</p>
            </div>
            <RegisterPatientForm today={today} onRegistered={registered} onUseExisting={(patient) => (canBook ? bookFor(patient) : setText(patient.mrn))} />
          </section>
        )}
      </div>
    </div>
  );
}
