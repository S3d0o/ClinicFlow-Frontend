// The permission catalog (backend docs/v2/02_ROLES_AND_PERMISSIONS.md §5). The UI checks
// permissions, never role names (ADR 0002); the backend returns each user's grants from `/me`.
export const PERMISSIONS = [
  // Organization
  'org.settings.manage', 'branches.manage', 'rooms.manage',
  // Staff
  'staff.view', 'staff.invite', 'staff.deactivate', 'roles.manage',
  // Recruitment
  'recruitment.view', 'recruitment.manage',
  // Catalog
  'specialties.manage', 'services.manage', 'prices.manage',
  // Scheduling
  'schedules.view', 'schedules.manage', 'schedules.manage_own', 'leave.request', 'leave.approve',
  'slots.block', 'slots.overbook',
  // Patients
  'patients.view', 'patients.register', 'patients.edit', 'patients.merge',
  // Appointments
  'appointments.view', 'appointments.book_on_behalf', 'appointments.reschedule', 'appointments.cancel',
  'appointments.check_in', 'appointments.mark_no_show', 'queue.view', 'queue.manage',
  // Clinical
  'encounters.view', 'encounters.write', 'encounters.sign', 'encounters.addend', 'encounters.void',
  'vitals.write', 'prescriptions.write', 'attachments.upload', 'records.break_glass',
  // Billing
  'invoices.view', 'invoices.create', 'invoices.discount', 'invoices.void', 'payments.collect',
  'refunds.request', 'refunds.approve', 'cash_sessions.operate', 'cash_sessions.reconcile',
  // Insurance
  'payers.manage', 'policies.manage', 'preauth.manage', 'claims.manage',
  // Reporting
  'reports.operational', 'reports.clinical', 'reports.financial',
  // System
  'audit.view', 'integrations.manage', 'notifications.templates',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Own records only, the assigned branches, or the whole organization (02 §4). */
export type Scope = 'Own' | 'Branch' | 'Organization';
