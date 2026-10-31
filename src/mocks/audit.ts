import type { AuditChange, AuditEntry, AuditValue } from '@/features/audit/model/audit';
import type { MockDb } from './db';
import type { MockSessionStore } from './session-store';

// The mock's stand-in for the backend's audit interceptor (FR-AUD-01): admin changes made in the demo
// write an entry, so they show up in the audit log.

/** Where the demo's requests come from. */
export const DEMO_IP = '41.33.120.18';

type Deps = { db: MockDb; session: MockSessionStore; now: () => Date };

/** Appends an entry for the signed-in user, as one request. */
export function recordAudit(
  { db, session, now }: Deps,
  entry: Pick<AuditEntry, 'action' | 'entityType' | 'entityId' | 'changes'> & { reason?: string }
): AuditEntry {
  const user = db.users.find((u) => u.id === session.get());
  const recorded: AuditEntry = {
    ...entry,
    id: `aud-${crypto.randomUUID()}`,
    occurredAt: now().toISOString(),
    userId: user?.id,
    userName: user?.fullName,
    ipAddress: DEMO_IP,
    correlationId: crypto.randomUUID(),
  };
  db.auditEntries.push(recorded);
  return recorded;
}

const auditValue = (value: unknown): AuditValue =>
  value === undefined || value === null ? null : typeof value === 'object' ? JSON.stringify(value) : (value as AuditValue);

/** The properties of `keys` whose value differs between `before` and `after`. */
export function diffChanges<T extends object>(before: T, after: T, keys: (keyof T & string)[]): Record<string, AuditChange> {
  const changes: Record<string, AuditChange> = {};
  for (const key of keys) {
    const [old, next] = [auditValue(before[key]), auditValue(after[key])];
    if (old !== next) changes[key] = { old, new: next };
  }
  return changes;
}

/** A created record's properties, as a Create entry records them. */
export function createdChanges<T extends object>(record: T, keys: (keyof T & string)[]): Record<string, AuditChange> {
  return Object.fromEntries(keys.filter((key) => record[key] !== undefined).map((key) => [key, { new: auditValue(record[key]) }]));
}
