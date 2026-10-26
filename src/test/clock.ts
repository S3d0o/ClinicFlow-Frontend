import { afterEach, beforeEach, vi } from 'vitest';
import { TEST_NOW } from './mock-backend';

/**
 * Runs every test of the calling `describe` at a fixed time (default `TEST_NOW`), for screens whose
 * sample data and rules depend on the clock (the front desk's day). Only `Date` is faked and it keeps
 * moving from there, so timers, `findBy…` and the mock backend work as usual.
 */
export function fixClock(now: string = TEST_NOW) {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(now), shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}
