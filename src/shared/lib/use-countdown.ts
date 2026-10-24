import { useEffect, useState } from 'react';

/** Whole seconds left until `target` (an ISO timestamp), updated every second; 0 once it has passed. */
export function useCountdown(target: string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const end = Date.parse(target);
    // The clock stops between countdowns, so refresh it at once when a new target arrives
    const refresh = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= end) window.clearInterval(timer);
    }, 1000);
    return () => {
      window.clearTimeout(refresh);
      window.clearInterval(timer);
    };
  }, [target]);

  return target ? Math.max(0, Math.ceil((Date.parse(target) - now) / 1000)) : 0;
}

const two = (n: number) => String(n).padStart(2, '0');

/** 125 → "2:05"; 3725 → "1:02:05" */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds % 60)}` : `${minutes}:${two(seconds % 60)}`;
}
