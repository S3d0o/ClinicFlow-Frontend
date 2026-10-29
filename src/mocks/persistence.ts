import type { MockDb } from './db';

/**
 * Keeps the demo's mock database in the browser, so a reload (or an accidental F5 during a
 * presentation) doesn't throw away what was just done. Only the app's entry point uses it; tests
 * build a fresh database each.
 *
 * A saved copy is dropped, and the seed used instead, when it was saved on another day (the seeds
 * are dated relative to today), when `SEED_VERSION` changed, or when it can't be read.
 */

/** Bump when a seed or a table's shape changes, so older saved copies are dropped. */
export const SEED_VERSION = 3;

const KEY = 'clinicflow:demo-db';

/** The part of `Storage` this module uses (tests pass an in-memory one). */
export type MockDbStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** What isn't stored: uploaded files (seeded samples stand in after a reload) and live listeners. */
type StoredTables = Omit<MockDb, 'files' | 'queueListeners'>;

interface StoredDb {
  version: number;
  /** The local calendar day it was saved on, `yyyy-MM-dd`. */
  savedOn: string;
  tables: StoredTables;
}

const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** The browser's storage, or none when it is blocked (private windows, previews). */
function browserStorage(): MockDbStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

// Uploaded files (a Map of Blobs) and the queue's listeners (a Set) aren't data: leave them out
const skipLiveObjects = (_key: string, value: unknown) => (value instanceof Map || value instanceof Set ? undefined : value);

function serialize(db: MockDb, now: Date): string {
  const stored: StoredDb = { version: SEED_VERSION, savedOn: localDay(now), tables: db };
  return JSON.stringify(stored, skipLiveObjects);
}

/** The saved database, if there is a usable one from today; otherwise null. */
export function loadMockDb(now: Date, storage: MockDbStorage | undefined = browserStorage()): MockDb | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredDb>;
    if (stored.version !== SEED_VERSION || stored.savedOn !== localDay(now) || !stored.tables) return null;
    return { ...stored.tables, files: new Map(), queueListeners: new Set() };
  } catch {
    return null;
  }
}

/** Forgets the saved database, so the next load starts from the seed. */
export function clearMockDb(storage: MockDbStorage | undefined = browserStorage()) {
  try {
    storage?.removeItem(KEY);
  } catch {
    // Nothing stored
  }
}

export interface AutosaveOptions {
  now?: () => Date;
  storage?: MockDbStorage;
  intervalMs?: number;
}

/**
 * Saves `db` every `intervalMs` and when the page is hidden or unloaded. Writes only when something
 * changed. `stop()` ends it without a last save (used by "Reset demo data").
 */
export function startAutosave(
  db: MockDb,
  { now = () => new Date(), storage = browserStorage(), intervalMs = 5000 }: AutosaveOptions = {}
) {
  let last = '';
  const save = () => {
    try {
      const next = serialize(db, now());
      if (next === last) return;
      storage?.setItem(KEY, next);
      last = next;
    } catch {
      // Storage full or blocked: the demo keeps working, it just won't survive a reload
    }
  };
  const onHidden = () => {
    if (document.visibilityState === 'hidden') save();
  };

  const timer = setInterval(save, intervalMs);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', onHidden);

  return {
    save,
    stop() {
      clearInterval(timer);
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onHidden);
    },
  };
}
