// After a deploy, tabs still running the old build request page chunks whose hashed names no longer
// exist. Reloading picks up the new index.html (served with no-cache, see nginx.conf).

const RELOAD_KEY = 'chunkReloadAt';
// Don't reload again within this window, so a chunk that is genuinely broken can't cause a loop
const RELOAD_COOLDOWN_MS = 30_000;

/** Whether an error comes from a failed dynamic import (`lazy()` page chunk). */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(
    `${error.name} ${error.message}`
  );
}

/** Reloads the page unless it already did so recently. Returns whether a reload was started. */
export function reloadOnceForChunkError(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
