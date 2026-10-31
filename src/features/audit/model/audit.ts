// The audit log (FR-AUD-01, FR-AUD-03, FR-AUD-04; backend P1 PR 15, `AuditEntry`). Entries are
// append-only: the API reads and exports them, nothing edits or deletes them.

/** What an entry records. Stored as strings, so later actions (Read, Approve, BreakGlass) are additive. */
export const AUDIT_ACTIONS = ['Create', 'Update', 'Delete', 'Export'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * The audit names of the audited types (the backend's `IsAudited("<Name>")`). New types are
 * additive: an unknown name is shown as it is.
 */
export const AUDIT_ENTITY_TYPES = [
  'Appointment',
  'AuditLog',
  'Branch',
  'DoctorProfile',
  'MessageTemplate',
  'OrganizationSettings',
  'PriceListItem',
  'Service',
  'UserRole',
] as const;

export type AuditValue = string | number | boolean | null;

/**
 * One recorded property: `old` and `new` (only `new` on Create, only `old` on Delete), or
 * `changed: true` for redacted clinical text, whose values are never copied (08 §4).
 */
export interface AuditChange {
  old?: AuditValue;
  new?: AuditValue;
  changed?: true;
}

export interface AuditEntry {
  id: string;
  /** UTC. */
  occurredAt: string;
  /** Absent when no one was signed in (registration, background jobs). */
  userId?: string;
  userName?: string;
  ipAddress?: string;
  action: AuditAction;
  /** An audit name, e.g. "Appointment". */
  entityType: string;
  /** The record's id; a composite key's values joined by ",". */
  entityId: string;
  /** Property name → change. Empty for an export. */
  changes: Record<string, AuditChange>;
  /** Why, where an action requires one; an export records its filter here. */
  reason?: string;
  /** The same for every entry written by one request. */
  correlationId: string;
}

/** The viewer's filters (FR-AUD-03). `from` and `to` are inclusive days, `yyyy-MM-dd`, in the clinic's time zone. */
export interface AuditFilter {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
}

/** Why a filter can't be used, as a `common:validation.*` key; null when it can. */
export const auditFilterProblem = (filter: AuditFilter): 'validation.dateRange' | null =>
  filter.from && filter.to && filter.to < filter.from ? 'validation.dateRange' : null;

/** The changed properties in display order, redacted ones included. */
export const changedProperties = (entry: AuditEntry) => Object.entries(entry.changes);

const CSV_COLUMNS = ['occurredAt', 'userId', 'userName', 'ipAddress', 'action', 'entityType', 'entityId', 'changes', 'reason', 'correlationId'] as const;

const csvCell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/**
 * The export's CSV (RFC 4180, a header row, UTF-8 with a byte-order mark so spreadsheet apps read
 * Arabic). `changes` is the entry's JSON object. Formula-looking cells are prefixed with `'` so a
 * spreadsheet never runs them (CSV injection).
 */
export function auditCsv(entries: AuditEntry[]): string {
  const safe = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
  const rows = entries.map((entry) =>
    CSV_COLUMNS.map((column) => {
      const value = column === 'changes' ? JSON.stringify(entry.changes) : (entry[column] ?? '');
      return csvCell(column === 'changes' ? value : safe(String(value)));
    }).join(',')
  );
  return `﻿${[CSV_COLUMNS.join(','), ...rows].join('\r\n')}\r\n`;
}
