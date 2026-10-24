import type { AvailabilityDay, DoctorSearch, DoctorSort } from '../api/directory.service';

export const PAGE_SIZE = 10;

const SORTS: DoctorSort[] = ['soonest', 'rating', 'price'];
const DAYS: AvailabilityDay[] = ['today', 'tomorrow', 'week'];

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined;

/** The search in the URL (`/doctors?q=&branch=&specialty=&day=&lang=&sort=&page=`), so it can be shared. */
export function searchFromParams(params: URLSearchParams): DoctorSearch {
  const page = Number(params.get('page'));
  return {
    text: params.get('q') ?? undefined,
    branchId: params.get('branch') ?? undefined,
    specialtyId: params.get('specialty') ?? undefined,
    availability: oneOf(params.get('day'), DAYS),
    language: params.get('lang') ?? undefined,
    sort: oneOf(params.get('sort'), SORTS) ?? 'soonest',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE,
  };
}

/** The URL parameters for a search, leaving out defaults so links stay short. */
export function paramsFromSearch(search: Partial<DoctorSearch>): URLSearchParams {
  const params = new URLSearchParams();
  if (search.text?.trim()) params.set('q', search.text.trim());
  if (search.branchId) params.set('branch', search.branchId);
  if (search.specialtyId) params.set('specialty', search.specialtyId);
  if (search.availability) params.set('day', search.availability);
  if (search.language) params.set('lang', search.language);
  if (search.sort && search.sort !== 'soonest') params.set('sort', search.sort);
  if (search.page && search.page > 1) params.set('page', String(search.page));
  return params;
}

/** A changed filter starts again from page 1. */
export const withFilter = (search: DoctorSearch, change: Partial<DoctorSearch>): DoctorSearch => ({ ...search, ...change, page: 1 });
