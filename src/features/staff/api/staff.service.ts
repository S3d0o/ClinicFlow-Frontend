import type { Permission } from '@/features/auth/model/permissions';
import type { Role, RoleAssignment } from '@/features/auth/model/user';
import type { Page, PageRequest } from '@/shared/api/page';
import type { StaffFilter, StaffMember } from '../model/staff';

export interface InviteStaffRequest {
  fullName: string;
  email: string;
  roles: RoleAssignment[];
}

/** Staff and their access (port; 07 §4 `/api/v2/staff`). */
export interface StaffService {
  /** The directory, within the caller's `staff.view` scope (FR-STF-08). */
  list(filter: StaffFilter, page: PageRequest): Promise<Page<StaffMember>>;
  get(staffId: string): Promise<StaffMember>;
  /** A 72-hour, single-use link by email (FR-STF-01). */
  invite(request: InviteStaffRequest): Promise<StaffMember>;
  resendInvitation(staffId: string): Promise<StaffMember>;
  revokeInvitation(staffId: string): Promise<void>;
  /** Takes effect at the member's next token refresh (FR-STF-03). */
  setRoles(staffId: string, roles: RoleAssignment[]): Promise<StaffMember>;
  /** Now (no date) or on `endDate` (`yyyy-MM-dd`, the clinic's calendar). Sessions end then (FR-STF-04). */
  deactivate(staffId: string, endDate?: string): Promise<StaffMember>;
  /** The member sets up their authenticator again at their next sign-in (FR-STF-07). */
  resetMfa(staffId: string): Promise<StaffMember>;
}

/** How a role holds a permission (02 §6): organization-wide, as the role is assigned, own records, or only when held organization-wide. */
export type GrantCode = 'O' | 'A' | 'S' | 'OO';

export interface RolePermissions {
  role: Role;
  grants: Partial<Record<Permission, GrantCode>>;
}

/** The role × permission matrix (port). Read-only in release R1; editing it is FR-STF-06 (R3). */
export interface RolesService {
  getMatrix(): Promise<RolePermissions[]>;
}
