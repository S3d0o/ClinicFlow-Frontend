import type { QueryClient } from '@tanstack/react-query';

// The front desk, queue, triage and checkout read the same visits: a check-in shows on the day list,
// the queue board, the nurse's list and the checkout. Every change refreshes all of them.
const FRONT_DESK_KEYS = [['desk'], ['queue'], ['triage'], ['checkout'], ['cash'], ['patients'], ['appointments'], ['directory']] as const;

export function invalidateFrontDesk(queryClient: QueryClient) {
  return Promise.all(FRONT_DESK_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
