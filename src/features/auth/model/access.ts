import type { Permission, Scope } from './permissions';
import type { CurrentUser, Role } from './user';

const SCOPE_RANK: Record<Scope, number> = { Own: 0, Branch: 1, Organization: 2 };

/**
 * Whether the user holds `permission`, optionally for a record in `branchId`. Organization scope
 * covers every branch; Own scope is checked against the record's owner by the screen itself.
 */
export function can(user: CurrentUser | null | undefined, permission: Permission, branchId?: string): boolean {
  if (!user) return false;
  return user.permissions.some(
    (grant) =>
      grant.permission === permission &&
      (branchId === undefined || grant.scope !== 'Branch' || (grant.branchIds ?? []).includes(branchId))
  );
}

/**
 * Whether the user holds at least one of `permissions` at `minScope` or wider. Branch-wide screens
 * (a dashboard, a report) pass `Branch`, so a grant over one's own records only doesn't open them.
 */
export function canAny(
  user: CurrentUser | null | undefined,
  permissions: readonly Permission[],
  minScope: Scope = 'Own'
): boolean {
  if (!user) return false;
  return user.permissions.some(
    (grant) => permissions.includes(grant.permission) && SCOPE_RANK[grant.scope] >= SCOPE_RANK[minScope]
  );
}

export const hasRole = (user: CurrentUser | null | undefined, role: Role) =>
  !!user?.roles.some((assignment) => assignment.role === role);

export const isStaff = (user: CurrentUser | null | undefined) =>
  !!user?.roles.some((assignment) => assignment.role !== 'Patient');

// Where each role starts (02 §8). For a user with several roles, the first match wins, so an
// organization manager who is also a doctor opens the manager dashboard.
const HOME_BY_ROLE: [Role, string][] = [
  ['Manager', '/manager'],
  ['Admin', '/admin'],
  ['Doctor', '/doctor'],
  ['Receptionist', '/desk'],
  ['Nurse', '/nurse'],
  ['Accountant', '/finance'],
  ['Patient', '/patient'],
];

/** The user's home page: their workspace, or "My application" for a doctor applicant. */
export function homePath(user: CurrentUser | null | undefined): string {
  if (!user) return '/';
  const match = HOME_BY_ROLE.find(([role]) => hasRole(user, role));
  if (match) return match[1];
  return user.hasDoctorApplication ? '/my-application' : '/';
}

/**
 * The page to open after signing in: the page the user was trying to reach when it is theirs to
 * open, otherwise their home page.
 */
export function postSignInPath(user: CurrentUser, from: string | undefined, canOpen: (path: string) => boolean) {
  const isAuthPage = !from || from === '/' || /^\/(sign-in|sign-up|forgot-password|reset-password)/.test(from);
  return !isAuthPage && canOpen(from) ? from : homePath(user);
}
