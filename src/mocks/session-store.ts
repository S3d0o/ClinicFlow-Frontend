/** Remembers which demo user is signed in, so a page reload keeps the session (like refresh tokens do). */
export interface MockSessionStore {
  get(): string | null;
  set(userId: string): void;
  clear(): void;
}

const KEY = 'clinicflow:demo-session';

export const localSessionStore: MockSessionStore = {
  get: () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (userId) => {
    try {
      localStorage.setItem(KEY, userId);
    } catch {
      // Without storage the session lasts until the page is reloaded
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing stored
    }
  },
};

/** A session kept in memory only, for tests. */
export function memorySessionStore(initial: string | null = null): MockSessionStore {
  let userId = initial;
  return {
    get: () => userId,
    set: (id) => {
      userId = id;
    },
    clear: () => {
      userId = null;
    },
  };
}
