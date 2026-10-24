import type { CurrentUser, Role } from './user';

/** The label shown next to the user's name: their first staff role, else Patient or Applicant. */
export function primaryRoleLabel(user: CurrentUser): Role | 'Applicant' {
  const staffRole = user.roles.find((r) => r.role !== 'Patient');
  if (staffRole) return staffRole.role;
  if (user.roles.length > 0) return 'Patient';
  return 'Applicant';
}
