import { useState, type FormEvent } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { pageCount } from '@/shared/api/page';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatList } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Pagination } from '@/shared/ui/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import type { DoctorSearch, DoctorSort } from '../api/directory.service';
import { DoctorCard } from '../components/DoctorCard';
import { DoctorFilters } from '../components/DoctorFilters';
import { useDoctorSearch } from '../hooks/use-directory';
import { paramsFromSearch, searchFromParams, withFilter } from '../model/search-params';

const SORTS: DoctorSort[] = ['soonest', 'rating', 'price'];

/** Public doctor search (FR-PAT-01): text, branch, specialty, availability and language, kept in the URL. */
export default function FindDoctorPage() {
  const { t } = useTranslation(['doctors', 'screens', 'common']);
  const { language, direction } = useLanguage();
  const [params, setParams] = useSearchParams();
  const search = searchFromParams(params);
  const [text, setText] = useState(search.text ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useDoctorSearch(search);
  const { data: branches = [] } = useBranches();
  const { data: specialties = [] } = useSpecialties();

  const update = (next: DoctorSearch) => setParams(paramsFromSearch(next));
  const change = (filter: Partial<DoctorSearch>) => update(withFilter(search, filter));
  const hasFilters = !!(search.specialtyId || search.availability || search.language);

  const submitText = (event: FormEvent) => {
    event.preventDefault();
    change({ text });
  };

  const specialtyName = (id: string) => {
    const specialty = specialties.find((s) => s.id === id);
    return specialty ? nameIn(specialty, language) : '';
  };
  const branchNames = (ids: string[]) =>
    formatList(branches.filter((b) => ids.includes(b.id)).map((b) => branchName(b, language)), language);

  const filters = <DoctorFilters search={search} specialties={specialties} onChange={change} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t('screens:landing'), to: '/' }, { label: t('screens:findDoctor') }]} />
      <h1 className="font-display text-headline-lg text-ink sm:text-headline-xl">{t('screens:findDoctor')}</h1>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
        <form role="search" onSubmit={submitText} className="flex gap-2">
          <label htmlFor="doctor-search" className="sr-only">
            {t('find.searchLabel')}
          </label>
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="doctor-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('find.searchPlaceholder')} className="h-11 ps-9" />
          </div>
          <Button type="submit" size="lg">
            {t('find.search')}
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={t('find.branchFilter')} className="flex flex-wrap gap-2">
            {[{ id: '', name: t('find.allBranches') }, ...branches.map((b) => ({ id: b.id, name: branchName(b, language) }))].map((option) => {
              const active = (search.branchId ?? '') === option.id;
              return (
                <button
                  key={option.id || 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => change({ branchId: option.id || undefined })}
                  className={cn(
                    'min-h-9 rounded-full border px-4 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary hover:text-primary'
                  )}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span id="sort-label" className="text-body-sm text-muted-foreground">
              {t('find.sortLabel')}
            </span>
            <Select value={search.sort} onValueChange={(value) => change({ sort: value as DoctorSort })}>
              <SelectTrigger aria-labelledby="sort-label" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((sort) => (
                  <SelectItem key={sort} value={sort}>
                    {t(`find.sort.${sort}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside aria-label={t('find.filters')} className="hidden self-start rounded-xl border border-border bg-card p-5 lg:block">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-title-sm text-ink">{t('find.filters')}</h2>
            {hasFilters && (
              <Button variant="link" size="sm" className="h-auto px-0" onClick={() => change({ specialtyId: undefined, availability: undefined, language: undefined })}>
                {t('common:actions.clearAll')}
              </Button>
            )}
          </div>
          {filters}
        </aside>

        <section aria-labelledby="results-count" className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p id="results-count" aria-live="polite" className="text-body-md text-muted-foreground">
              {results.data && t('find.results', { count: results.data.total })}
            </p>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal aria-hidden="true" />
                  {t('find.filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="gap-4 overflow-y-auto p-6">
                <SheetTitle className="font-display text-title-sm text-ink">{t('find.filters')}</SheetTitle>
                {filters}
                <Button className="mt-auto" onClick={() => setFiltersOpen(false)}>
                  {t('find.showResults')}
                </Button>
              </SheetContent>
            </Sheet>
          </div>

          {results.isPending ? (
            <LoadingState />
          ) : results.isError ? (
            <ErrorState onRetry={() => void results.refetch()} />
          ) : results.data.items.length === 0 ? (
            <EmptyState title={t('find.emptyTitle')} description={t('find.emptyBody')} className="rounded-xl border border-dashed border-border" />
          ) : (
            <>
              <ul className={cn('space-y-4 transition-opacity', results.isPlaceholderData && 'opacity-60')}>
                {results.data.items.map((doctor) => (
                  <li key={doctor.id}>
                    <DoctorCard doctor={doctor} specialtyName={specialtyName(doctor.specialtyId)} branchNames={branchNames(doctor.branchIds)} />
                  </li>
                ))}
              </ul>
              <Pagination page={search.page} pageCount={pageCount(results.data.total, search.pageSize)} onChange={(page) => update({ ...search, page })} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
