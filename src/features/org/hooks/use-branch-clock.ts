import { todayIn, wallClockIn } from '@/shared/lib/branch-time';
import { useNow } from '@/shared/lib/use-now';
import type { Branch } from '../model/branch';

/** The branch's date and wall-clock time, ticking every `intervalMs` (ADR 0003: never the device zone). */
export function useBranchClock(branch: Pick<Branch, 'timeZone'> | null | undefined, intervalMs = 30_000) {
  const now = useNow(intervalMs);
  const timeZone = branch?.timeZone ?? 'Africa/Cairo';
  return { now, today: todayIn(timeZone, now), time: wallClockIn(timeZone, now), timeZone };
}
