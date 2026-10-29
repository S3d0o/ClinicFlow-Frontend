import { afterEach, describe, expect, it, vi } from 'vitest';
import { TEST_NOW } from '@/test/mock-backend';
import { createMockDb } from './db';
import { clearMockDb, loadMockDb, SEED_VERSION, startAutosave, type MockDbStorage } from './persistence';

function memoryStorage(): MockDbStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const now = new Date(TEST_NOW);

describe('mock database persistence', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads what was saved, without the uploaded files', () => {
    const storage = memoryStorage();
    const db = createMockDb(now);
    db.appointments[0].status = 'Cancelled';
    db.files.set('f-1', new Blob(['x']));
    const autosave = startAutosave(db, { now: () => now, storage });
    autosave.save();
    autosave.stop();

    const loaded = loadMockDb(now, storage);

    expect(loaded?.appointments[0].status).toBe('Cancelled');
    expect(loaded?.users).toEqual(db.users);
    expect(loaded?.files.size).toBe(0);
    expect(loaded?.queueListeners).toBeInstanceOf(Set);
  });

  it('drops a copy saved on another day', () => {
    const storage = memoryStorage();
    const autosave = startAutosave(createMockDb(now), { now: () => now, storage });
    autosave.save();
    autosave.stop();

    expect(loadMockDb(new Date(now.getTime() + 24 * 60 * 60_000), storage)).toBeNull();
  });

  it('drops a copy from an older seed version', () => {
    const storage = memoryStorage();
    const autosave = startAutosave(createMockDb(now), { now: () => now, storage });
    autosave.save();
    autosave.stop();
    const [key, raw] = [...storage.data][0];
    storage.setItem(key, JSON.stringify({ ...JSON.parse(raw), version: SEED_VERSION - 1 }));

    expect(loadMockDb(now, storage)).toBeNull();
  });

  it('starts from the seed when nothing usable is stored', () => {
    const storage = memoryStorage();
    expect(loadMockDb(now, storage)).toBeNull();
    storage.setItem('clinicflow:demo-db', '{not json');
    expect(loadMockDb(now, storage)).toBeNull();
  });

  it('keeps working when storage is blocked or full', () => {
    const storage: MockDbStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const autosave = startAutosave(createMockDb(now), { now: () => now, storage });

    expect(() => autosave.save()).not.toThrow();
    expect(loadMockDb(now, storage)).toBeNull();
    expect(() => clearMockDb(storage)).not.toThrow();
    autosave.stop();
  });

  it('saves on a timer and when the page is hidden, until stopped', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const db = createMockDb(now);
    const autosave = startAutosave(db, { now: () => now, storage, intervalMs: 1000 });

    vi.advanceTimersByTime(1000);
    expect(storage.data.size).toBe(1);

    db.appointments[0].status = 'Cancelled';
    window.dispatchEvent(new Event('pagehide'));
    expect(loadMockDb(now, storage)?.appointments[0].status).toBe('Cancelled');

    autosave.stop();
    clearMockDb(storage);
    vi.advanceTimersByTime(5000);
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.data.size).toBe(0);
  });
});
