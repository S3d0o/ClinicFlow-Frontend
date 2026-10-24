import type { CurrentUser } from '@/features/auth/model/user';
import type { Branch } from './branch';

/**
 * The branches a staff member works in: every branch for a role held organization-wide, otherwise
 * the branches of their assignments (02 §3). Patient roles don't count.
 */
export function accessibleBranches(user: CurrentUser | null, branches: Branch[]): Branch[] {
  const staffRoles = user?.roles.filter((r) => r.role !== 'Patient') ?? [];
  if (staffRoles.some((r) => r.scope === 'Organization')) return branches;
  const ids = new Set(staffRoles.flatMap((r) => r.branchIds ?? []));
  return branches.filter((b) => ids.has(b.id));
}

/** Whether the user may look at several branches at once ("All branches" in the switcher). */
export const canSeeAllBranches = (user: CurrentUser | null) =>
  !!user?.roles.some((r) => r.role !== 'Patient' && r.scope === 'Organization');

/** The branch's name in the UI language (R9). */
export const branchName = (branch: Branch, language: 'ar' | 'en') => (language === 'ar' ? branch.nameAr : branch.nameEn);
