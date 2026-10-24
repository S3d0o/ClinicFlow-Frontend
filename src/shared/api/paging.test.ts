import { describe, expect, it } from 'vitest';
import { AxiosHeaders } from 'axios';
import { pageCount, readTotalCount } from './paging';

describe('readTotalCount', () => {
  it('reads the header whatever its case', () => {
    expect(readTotalCount({ 'x-total-count': '61' })).toBe(61);
    expect(readTotalCount(new AxiosHeaders({ 'X-Total-Count': '7' }))).toBe(7);
  });

  it('returns null when the header is missing or invalid', () => {
    expect(readTotalCount({})).toBeNull();
    expect(readTotalCount({ 'x-total-count': 'abc' })).toBeNull();
    expect(readTotalCount({ 'x-total-count': '-1' })).toBeNull();
  });
});

describe('pageCount', () => {
  it('rounds up and never returns 0', () => {
    expect(pageCount(0, 20)).toBe(1);
    expect(pageCount(20, 20)).toBe(1);
    expect(pageCount(21, 20)).toBe(2);
  });
});
