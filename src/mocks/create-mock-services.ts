import type { Services } from '@/app/services';
import { createMockAuthService, createMockDemoAccountsService } from '@/features/auth/api/auth.mock';
import { createMockOrgService } from '@/features/org/api/org.mock';
import { createMockDb, type MockDb } from './db';
import { localSessionStore, type MockSessionStore } from './session-store';

export interface MockServicesOptions {
  db?: MockDb;
  session?: MockSessionStore;
  /** Simulated network delay per call; tests pass 0. */
  latencyMs?: number;
}

/** Wires every mock adapter to one shared in-memory database. */
export function createMockServices({
  db = createMockDb(),
  session = localSessionStore,
  latencyMs = 250,
}: MockServicesOptions = {}): Services {
  const deps = { db, session, latencyMs };
  return {
    auth: createMockAuthService(deps),
    org: createMockOrgService(deps),
    demoAccounts: createMockDemoAccountsService(deps),
  };
}
