import type { Branch } from '@/features/org/model/branch';
import { branchesSeed } from './seed/branches';
import { usersSeed, type UserSeed } from './seed/users';

/**
 * The in-memory backend the mock adapters read and write. Every adapter gets the same instance, so a
 * change made on one screen (a booking, a check-in) shows up on the others, like with a real API.
 * Each phase adds its tables here, with seed data in `seed/`.
 */
export interface MockDb {
  branches: Branch[];
  users: UserSeed[];
}

/** A fresh copy of the seed data (tests get an isolated database each). */
export function createMockDb(): MockDb {
  return structuredClone({ branches: branchesSeed, users: usersSeed });
}

/** Resolves after `ms` milliseconds, to make loading states visible like a real network. */
export const delay = (ms: number) =>
  ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
