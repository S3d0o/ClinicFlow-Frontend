import type { Page, PageRequest } from '@/shared/api/page';
import type { AuditEntry, AuditFilter } from '../model/audit';

/**
 * The audit log (port; backend P1 PR 15, `GET /api/v2/audit` and its CSV export, `audit.view`: admins
 * and managers who hold the role organization-wide). Read-only (FR-AUD-04).
 *
 * Errors: `Audit.InvalidRange` (`to` before `from`; stands in for the 400 validation error on `to`),
 * `Access.OutOfScope`.
 */
export interface AuditService {
  /** Matching entries, newest first; *paged* (`X-Total-Count`). */
  list(filter: AuditFilter, page: PageRequest): Promise<Page<AuditEntry>>;
  /**
   * Every matching entry as CSV (`text/csv`, newest first). The export is itself audited: it writes an
   * `Export` entry (entity type `AuditLog`) recording the filter.
   */
  exportCsv(filter: AuditFilter): Promise<Blob>;
}
