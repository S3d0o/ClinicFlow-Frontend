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
        className="mb-8 grid gap-3 rounded-xl border bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:items-end"
      >
        <div className="space-y-1.5">
          <Label htmlFor="doctor-name" className="text-xs text-muted-foreground">Doctor name</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="doctor-name" placeholder="e.g. Ahmed" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-city" className="text-xs text-muted-foreground">City</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="doctor-city" placeholder="e.g. Cairo" value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-specialty" className="text-xs text-muted-foreground">Specialty</Label>
          <Select value={specialtyId} onValueChange={(v) => { setSpecialtyId(v); setPageNumber(1); }}>
            <SelectTrigger id="doctor-specialty" className="w-full">
              <SelectValue placeholder="All specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-sort" className="text-xs text-muted-foreground">Sort by</Label>
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
      </form>

      {/* Results */}
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-card">
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
                  className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-card transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3.5">
                    <UserAvatar name={doctor.fullName} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-foreground">{doctor.fullName}</h2>
                      <p className="text-sm font-medium text-primary">{doctor.specialtyName}</p>
                      <RatingSummary rating={doctor.averageRating} className="mt-1.5" />
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-sm">
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden="true" />City</dt>
                      <dd className="mt-0.5 truncate font-medium">{doctor.clinicCity || '—'}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground"><Briefcase className="size-3" aria-hidden="true" />Experience</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{doctor.yearsOfExperience} yrs</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Fee</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums">{formatFee(doctor.consultationFee)}</dd>
                    </div>
                  </dl>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
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
