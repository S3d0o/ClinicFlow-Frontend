import { AxiosHeaders, type AxiosResponse } from 'axios';

/** Response header with the number of matching items on paged lists (API contract §1, #32 and #38). */
export const TOTAL_COUNT_HEADER = 'X-Total-Count';

/** The total from `X-Total-Count`, or `null` when the header is missing or not a number. */
export function readTotalCount(headers: AxiosResponse['headers']): number | null {
  const value = AxiosHeaders.from(headers as Record<string, string>).get(TOTAL_COUNT_HEADER);
  if (value === null || value === undefined || value === '') return null;
  const total = Number(value);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

/** Number of pages needed for `total` items, at least 1. */
export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));
