import { describe, expect, it } from 'vitest';
import { paramsFromSearch, searchFromParams, withFilter } from './search-params';

describe('doctor search in the URL', () => {
  it('reads every filter and falls back to defaults for missing or invalid values', () => {
    expect(searchFromParams(new URLSearchParams('q=heart&branch=br-ma&day=today&sort=price&page=2'))).toEqual({
      text: 'heart',
      branchId: 'br-ma',
      specialtyId: undefined,
      availability: 'today',
      language: undefined,
      sort: 'price',
      page: 2,
      pageSize: 10,
    });
    expect(searchFromParams(new URLSearchParams('day=someday&sort=random&page=-3'))).toMatchObject({
      availability: undefined,
      sort: 'soonest',
      page: 1,
    });
  });

  it('writes only what differs from the defaults', () => {
    expect(paramsFromSearch({ text: '  ', sort: 'soonest', page: 1 }).toString()).toBe('');
    expect(paramsFromSearch({ specialtyId: 'sp-cardio', sort: 'rating', page: 3 }).toString()).toBe('specialty=sp-cardio&sort=rating&page=3');
  });

  it('round-trips a search', () => {
    const search = searchFromParams(new URLSearchParams('q=x&branch=br-nc&specialty=sp&day=week&lang=en&sort=rating&page=4'));
    expect(searchFromParams(paramsFromSearch(search))).toEqual(search);
  });

  it('returns to page 1 when a filter changes', () => {
    const search = searchFromParams(new URLSearchParams('page=5'));
    expect(withFilter(search, { branchId: 'br-ma' })).toMatchObject({ branchId: 'br-ma', page: 1 });
  });
});
