import type { Language } from '@/shared/i18n/languages';
import type { Permission, Scope } from './permissions';

export const ROLES = ['Admin', 'Manager', 'Receptionist', 'Nurse', 'Doctor', 'Accountant', 'Patient'] as const;
export type Role = (typeof ROLES)[number];

/** One permission held at a scope. `branchIds` lists the branches when the scope is `Branch`. */
export interface PermissionGrant {
  permission: Permission;
  scope: Scope;
  branchIds?: string[];
}

/** A role held at the organization or at specific branches (02 §3). */
export interface RoleAssignment {
  role: Role;
  scope: 'Organization' | 'Branch';
  branchIds?: string[];
}

/** The signed-in user, shaped like `GET /api/v2/me` (07_API_DESIGN §2). */
export interface CurrentUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredLanguage: Language;
  roles: RoleAssignment[];
  permissions: PermissionGrant[];
  phoneVerified: boolean;
  emailConfirmed: boolean;
  /** A doctor applicant has no role but an open application (02 §2). */
  hasDoctorApplication: boolean;
  /** Staff must use two-step sign-in (FR-STF-07). */
  mfaEnabled: boolean;
  /** Whether the authenticator app is set up. Staff without it can only open the setup screen. */
  mfaEnrolled: boolean;
}
