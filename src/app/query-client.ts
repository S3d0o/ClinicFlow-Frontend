import { QueryClient } from '@tanstack/react-query';
import { isServiceError } from '@/shared/api/service-error';

/**
 * Server-state cache. Business errors (a `ServiceError` code) are answers, not glitches, so they are
 * never retried; other failures get one retry.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => !isServiceError(error) && failureCount < 1,
      },
      mutations: { retry: false },
    },
  });
}
