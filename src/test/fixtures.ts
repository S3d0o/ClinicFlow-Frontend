import type { CurrentUser, RoleAssignment } from '@/features/auth/model/user';
import { grantsFor } from '@/mocks/seed/role-permissions';

/** A user with the given role assignments and the default permissions they grant. */
export function makeUser(roles: RoleAssignment[], overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: 'u-test',
    fullName: 'Test User',
    phone: '+201000000000',
    preferredLanguage: 'en',
    roles,
    permissions: grantsFor(roles),
    phoneVerified: true,
    emailConfirmed: true,
    hasDoctorApplication: false,
    mfaEnabled: roles.some((r) => r.role !== 'Patient'),
    mfaEnrolled: true,
    ...overrides,
  };
}

export const at = (role: RoleAssignment['role'], ...branchIds: string[]): RoleAssignment => ({
  role,
  scope: 'Branch',
  branchIds,
});

export const org = (role: RoleAssignment['role']): RoleAssignment => ({ role, scope: 'Organization' });
