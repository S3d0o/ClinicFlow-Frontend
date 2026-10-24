/** One page of a list: the items and the total count (the API's `X-Total-Count`, 07_API_DESIGN §3). */
export interface Page<T> {
  items: T[];
  total: number;
}

export interface PageRequest {
  /** 1-based. */
  page: number;
  pageSize: number;
}

export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));
