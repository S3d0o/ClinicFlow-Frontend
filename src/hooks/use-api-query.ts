import { useCallback, useEffect, useRef, useState } from 'react';

interface Settled<T> {
  key: string;
  data?: T;
  error?: unknown;
}

/**
 * Loads data for a page and tracks its loading and error state.
 *
 * - `load` runs on mount and again whenever `key` changes, so put every input of the request in
 *   `key` (e.g. `${status}|${page}`). Responses for an older key are ignored.
 * - `reload()` runs the request again (after a mutation, or from an error's "Try again").
 * - `setData` updates the loaded data locally (e.g. after marking an item as read).
 */
export function useApiQuery<T>(load: () => Promise<T>, key = '') {
  // Always call the latest `load`, without making it an effect dependency
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${key}#${reloadCount}`;
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let current = true;
    loadRef.current().then(
      (data) => current && setSettled({ key: requestKey, data }),
      (error: unknown) => current && setSettled({ key: requestKey, error })
    );
    return () => {
      current = false;
    };
  }, [requestKey]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  const setData = useCallback((update: (prev: T) => T) => {
    setSettled((s) => (s && s.data !== undefined ? { ...s, data: update(s.data) } : s));
  }, []);

  const loading = settled?.key !== requestKey;
  return {
    data: settled?.data,
    error: loading ? undefined : settled?.error,
    loading,
    reload,
    setData,
  };
}
