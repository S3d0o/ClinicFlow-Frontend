import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi, specialtiesApi } from '@/api';
import type { DoctorSummary, Specialty, DoctorSortBy } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatFee } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { UserAvatar } from '@/components/UserAvatar';
import { RatingSummary } from '@/components/Rating';
import { ArrowRight, Briefcase, MapPin, Search, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtyId, setSpecialtyId] = useState<string>('all');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [name, setName] = useState('');
  const [sortBy, setSortBy] = useState<DoctorSortBy>('Rating');
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchDoctors = useCallback(async () => {
    // Ignore responses that arrive after a newer request (fast filter changes)
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await doctorsApi.list({
        ...(specialtyId !== 'all' ? { specialtyId: Number(specialtyId) } : {}),
        ...(city ? { city } : {}),
        ...(name ? { name } : {}),
        sortBy,
        pageNumber,
        pageSize: PAGE_SIZE,
      });
      if (currentRequest !== requestId.current) return;
      setDoctors(res.data);
      setHasMore(res.data.length === PAGE_SIZE);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setDoctors([]);
      setHasMore(false);
      setError(getApiErrorMessage(err, 'Failed to load doctors'));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [specialtyId, city, name, sortBy, pageNumber]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    specialtiesApi.getAll().then((res) => setSpecialties(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCity(cityInput);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setName(nameInput);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameInput]);

  // Apply typed filters immediately instead of waiting for the debounce
  const applySearch = () => {
    setName(nameInput);
    setCity(cityInput);
    setPageNumber(1);
  };

  const hasFilters = name !== '' || city !== '' || specialtyId !== 'all';
  const clearFilters = () => {
    setNameInput('');
    setCityInput('');
    setName('');
    setCity('');
    setSpecialtyId('all');
    setPageNumber(1);
  };

  return (
    <Page width="full">
      <PageHeader
        eyebrow="Clinic directory"
        title="Find a doctor"
        description="Browse approved specialists, compare experience and fees, and book an open slot."
      />

      {/* Filters */}
      <form
        role="search"
        aria-label="Filter doctors"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
        className="mb-8 rounded-2xl border border-border/70 bg-card p-4 shadow-card sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="doctor-name" className="text-label-sm uppercase tracking-[0.08em] text-muted-foreground">Doctor name</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="doctor-name" placeholder="Search by doctor name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-city" className="text-label-sm uppercase tracking-[0.08em] text-muted-foreground">City</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="doctor-city" placeholder="e.g. Cairo" value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-sort" className="text-label-sm uppercase tracking-[0.08em] text-muted-foreground">Sort by</Label>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as DoctorSortBy); setPageNumber(1); }}>
            <SelectTrigger id="doctor-sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rating">Top rated</SelectItem>
              <SelectItem value="Fee">Lowest fee</SelectItem>
              <SelectItem value="Experience">Most experienced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="sm:col-span-2 lg:col-span-1">
          <Search aria-hidden="true" /> Search
        </Button>
        </div>

        {/* Specialty chips filter immediately */}
        <div role="group" aria-label="Specialty" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
          {[{ id: 'all', name: 'All specialties' }, ...specialties.map((s) => ({ id: String(s.id), name: s.name }))].map((s) => {
            const active = specialtyId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => { setSpecialtyId(s.id); setPageNumber(1); }}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-4 text-label-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground'
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </form>

      {/* Results */}
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mt-6 h-3 w-full" />
              </div>
            ))}
            <span className="sr-only">Loading doctors…</span>
          </div>
        ) : error ? (
          <ErrorState title="Couldn’t load doctors" message={error} onRetry={fetchDoctors} />
        ) : doctors.length === 0 ? (
          pageNumber > 1 ? (
            <EmptyState icon={Stethoscope} title="No more doctors" description="You’ve reached the end of the results." />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No doctors match your search"
              description="Try a different name or city, or browse all specialties."
              action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
            />
          )
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <li key={doctor.id}>
                <Link
                  to={`/doctors/${doctor.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-[border-color,box-shadow] hover:border-input hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3.5">
                    <UserAvatar name={doctor.fullName} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-title-sm text-foreground">{doctor.fullName}</h2>
                      <p className="text-label-md text-primary">{doctor.specialtyName}</p>
                      <RatingSummary rating={doctor.averageRating} className="mt-1.5" />
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted px-3 py-3 text-sm">
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1 text-caption uppercase tracking-wider text-muted-foreground"><MapPin className="size-3" aria-hidden="true" />City</dt>
                      <dd className="mt-0.5 truncate font-medium">{doctor.clinicCity || '—'}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-caption uppercase tracking-wider text-muted-foreground"><Briefcase className="size-3" aria-hidden="true" />Experience</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{doctor.yearsOfExperience} yrs</dd>
                    </div>
                    <div>
                      <dt className="text-caption uppercase tracking-wider text-muted-foreground">Fee</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums">{formatFee(doctor.consultationFee)}</dd>
                    </div>
                  </dl>
                  <span className="mt-4 inline-flex items-center gap-1 text-label-md text-primary">
                    View profile & book
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paging stays visible on an empty later page so the user can go back */}
      {!loading && !error && (doctors.length > 0 || pageNumber > 1) && (
        <Pagination page={pageNumber} hasNext={hasMore} onChange={setPageNumber} label="Doctor results pages" />
      )}
    </Page>
  );
}
