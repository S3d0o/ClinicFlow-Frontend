import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApiQuery } from './use-api-query';

/** A promise the test settles by hand */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useApiQuery', () => {
  it('loads data on mount', async () => {
    const { result } = renderHook(() => useApiQuery(() => Promise.resolve(['a', 'b'])));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.error).toBeUndefined();
  });

  it('reports a failure as an error, not as empty data', async () => {
    const failure = new Error('down');
    const { result } = renderHook(() => useApiQuery(() => Promise.reject(failure)));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeUndefined();
  });

  it('reload() runs the request again and clears the error', async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useApiQuery(load));
    await waitFor(() => expect(result.current.error).toBeDefined());

    act(() => result.current.reload());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('ignores a response for a key the page has moved away from', async () => {
    const requests: Record<string, ReturnType<typeof deferred<string>>> = { page1: deferred(), page2: deferred() };
    const { result, rerender } = renderHook(({ page }) => useApiQuery(() => requests[page].promise, page), {
      initialProps: { page: 'page1' },
    });

    rerender({ page: 'page2' });
    await act(async () => requests.page2.resolve('page 2 data'));
    await act(async () => requests.page1.resolve('stale page 1 data'));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('page 2 data');
  });

  it('setData() updates the loaded data locally', async () => {
    const { result } = renderHook(() => useApiQuery(() => Promise.resolve([1, 2])));
    await waitFor(() => expect(result.current.data).toEqual([1, 2]));
    act(() => result.current.setData((prev) => [...prev, 3]));
    expect(result.current.data).toEqual([1, 2, 3]);
  });
});
