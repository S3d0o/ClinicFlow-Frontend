import { createMockDb } from '@/mocks/db';
import { createMockServices } from '@/mocks/create-mock-services';
import { memorySessionStore } from '@/mocks/session-store';

/** Saturday 24 October 2026, 08:00 in Cairo: a working day for most seeded doctors. */
export const TEST_NOW = '2026-10-24T05:00:00Z';

interface Options {
  /** A seeded user id to start signed in as. */
  signedInAs?: string;
  now?: string;
}

/** The mock backend with no delay, an in-memory session and a clock tests can move forward. */
export function createTestBackend({ signedInAs, now = TEST_NOW }: Options = {}) {
  let time = Date.parse(now);
  const clock = () => new Date(time);
  const db = createMockDb(clock());
  const session = memorySessionStore(signedInAs ?? null);
  const services = createMockServices({ db, session, latencyMs: 0, now: clock });
  return {
    services,
    db,
    session,
    /** Moves the clock forward by `ms` milliseconds. */
    advance: (ms: number) => {
      time += ms;
    },
  };
}
