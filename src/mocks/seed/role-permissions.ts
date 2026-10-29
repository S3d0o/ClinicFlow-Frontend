import type { Permission } from '@/features/auth/model/permissions';
import type { PermissionGrant, Role, RoleAssignment } from '@/features/auth/model/user';

// The default role × permission matrix (backend docs/v2/02_ROLES_AND_PERMISSIONS.md §6), which the
// real backend resolves into `/me` permissions. Codes: O = organization, A = as the role is assigned
// (organization or its branches), S = own records, OO = only when the role is held organization-wide.
// Grants that depend on the medical-director flag (encounters.view for managers, break-glass,
// clinical reports, encounter voids) are left out of the sample data.
type Code = 'O' | 'A' | 'S' | 'OO';

export const MATRIX: Record<Role, Partial<Record<Permission, Code>>> = {
  Admin: {
    'org.settings.manage': 'O', 'branches.manage': 'O', 'staff.view': 'O', 'staff.invite': 'O',
    'staff.deactivate': 'O', 'roles.manage': 'O', 'specialties.manage': 'O', 'audit.view': 'O',
    'integrations.manage': 'O', 'notifications.templates': 'O',
  },
  Manager: {
    'org.settings.manage': 'OO', 'branches.manage': 'A', 'rooms.manage': 'A', 'staff.view': 'A',
    'staff.invite': 'A', 'staff.deactivate': 'A', 'recruitment.view': 'A', 'recruitment.manage': 'A',
    'specialties.manage': 'OO', 'services.manage': 'A', 'prices.manage': 'A', 'schedules.view': 'A',
    'schedules.manage': 'A', 'leave.approve': 'A', 'slots.block': 'A', 'slots.overbook': 'A',
    'patients.view': 'A', 'patients.register': 'A', 'patients.edit': 'A', 'patients.merge': 'OO',
    'appointments.view': 'A', 'appointments.book_on_behalf': 'A', 'appointments.reschedule': 'A',
    'appointments.cancel': 'A', 'appointments.check_in': 'A', 'appointments.mark_no_show': 'A',
    'queue.view': 'A', 'queue.manage': 'A', 'invoices.view': 'A', 'invoices.create': 'A',
    'invoices.discount': 'A', 'invoices.void': 'A', 'payments.collect': 'A', 'refunds.request': 'A',
    'refunds.approve': 'A', 'cash_sessions.reconcile': 'A', 'payers.manage': 'OO', 'policies.manage': 'A',
    'preauth.manage': 'A', 'claims.manage': 'OO', 'reports.operational': 'A', 'reports.financial': 'A',
    'audit.view': 'OO', 'notifications.templates': 'OO',
  },
  Receptionist: {
    'staff.view': 'A', 'schedules.view': 'A', 'slots.block': 'A', 'patients.view': 'A',
    'patients.register': 'A', 'patients.edit': 'A', 'appointments.view': 'A',
    'appointments.book_on_behalf': 'A', 'appointments.reschedule': 'A', 'appointments.cancel': 'A',
    'appointments.check_in': 'A', 'appointments.mark_no_show': 'A', 'queue.view': 'A', 'queue.manage': 'A',
    'attachments.upload': 'A', 'invoices.view': 'A', 'invoices.create': 'A', 'invoices.discount': 'A',
    'payments.collect': 'A', 'refunds.request': 'A', 'cash_sessions.operate': 'A', 'policies.manage': 'A',
    'preauth.manage': 'A',
  },
  Nurse: {
    'staff.view': 'A', 'schedules.view': 'A', 'patients.view': 'A', 'appointments.view': 'A',
    'appointments.check_in': 'A', 'queue.view': 'A', 'queue.manage': 'A', 'encounters.view': 'A',
    'vitals.write': 'A', 'attachments.upload': 'A',
  },
  Doctor: {
    'staff.view': 'A', 'schedules.view': 'A', 'schedules.manage_own': 'S', 'leave.request': 'S',
    'slots.block': 'S', 'slots.overbook': 'S', 'patients.view': 'A', 'appointments.view': 'S',
    'appointments.reschedule': 'S', 'appointments.cancel': 'S', 'appointments.mark_no_show': 'S',
    'queue.view': 'A', 'queue.manage': 'S', 'encounters.view': 'A', 'encounters.write': 'S',
    'encounters.sign': 'S', 'encounters.addend': 'S', 'encounters.void': 'S', 'vitals.write': 'A',
    'prescriptions.write': 'S', 'attachments.upload': 'A', 'records.break_glass': 'A', 'invoices.view': 'S',
    'preauth.manage': 'S', 'reports.operational': 'S', 'reports.clinical': 'S', 'reports.financial': 'S',
  },
  Accountant: {
    'staff.view': 'A', 'prices.manage': 'O', 'patients.view': 'A', 'appointments.view': 'A',
    'invoices.view': 'A', 'invoices.create': 'A', 'invoices.discount': 'A', 'invoices.void': 'A',
    'payments.collect': 'A', 'refunds.request': 'A', 'refunds.approve': 'O', 'cash_sessions.operate': 'A',
    'cash_sessions.reconcile': 'A', 'payers.manage': 'O', 'policies.manage': 'A', 'preauth.manage': 'A',
    'claims.manage': 'A', 'reports.operational': 'A', 'reports.financial': 'A',
  },
  Patient: {
    'patients.view': 'S', 'patients.register': 'S', 'patients.edit': 'S', 'appointments.view': 'S',
    'appointments.reschedule': 'S', 'appointments.cancel': 'S', 'attachments.upload': 'S',
    'invoices.view': 'S', 'payments.collect': 'S', 'policies.manage': 'S',
  },
};

function grantFor(permission: Permission, code: Code, assignment: RoleAssignment): PermissionGrant | null {
  const orgWide = assignment.scope === 'Organization';
  switch (code) {
    case 'O':
      return { permission, scope: 'Organization' };
    case 'OO':
      return orgWide ? { permission, scope: 'Organization' } : null;
    case 'S':
      return { permission, scope: 'Own' };
    case 'A':
      return orgWide
        ? { permission, scope: 'Organization' }
        : { permission, scope: 'Branch', branchIds: assignment.branchIds ?? [] };
  }
}

const SCOPE_RANK = { Own: 0, Branch: 1, Organization: 2 } as const;

/**
 * The effective permissions of a set of role assignments: the union across roles, keeping the
 * widest scope for each permission (02 §4) and merging branch lists at Branch scope.
 */
export function grantsFor(assignments: RoleAssignment[]): PermissionGrant[] {
  const byPermission = new Map<Permission, PermissionGrant>();
  for (const assignment of assignments) {
    for (const [permission, code] of Object.entries(MATRIX[assignment.role]) as [Permission, Code][]) {
      const grant = grantFor(permission, code, assignment);
      if (!grant) continue;
      const current = byPermission.get(permission);
      if (!current || SCOPE_RANK[grant.scope] > SCOPE_RANK[current.scope]) {
        byPermission.set(permission, grant);
      } else if (current.scope === 'Branch' && grant.scope === 'Branch') {
        const branchIds = [...new Set([...(current.branchIds ?? []), ...(grant.branchIds ?? [])])];
        byPermission.set(permission, { ...current, branchIds });
      }
    }
  }
  return [...byPermission.values()];
}
