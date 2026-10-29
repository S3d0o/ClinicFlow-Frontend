import { z } from 'zod';
import { hasRole } from '@/features/auth/model/access';
import { ROLES, type CurrentUser, type Role, type RoleAssignment } from '@/features/auth/model/user';

// The staff directory and access (FR-STF-01, 03, 04, 08; 07 §4 "Organization, branches, staff").

/** Staff roles: every role but the patient capacity of an account. */
export const STAFF_ROLES = ROLES.filter((role): role is Exclude<Role, 'Patient'> => role !== 'Patient');
export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Invited: the link is out, not accepted yet. Leaving: deactivation is set for a future date.
 * Deactivated: can't sign in; their records keep them as author (FR-STF-04).
 */
export const STAFF_STATUSES = ['Active', 'Invited', 'Leaving', 'Deactivated'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export interface StaffMember {
  /** The account id, or the invitation's id while invited. */
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  roles: RoleAssignment[];
  status: StaffStatus;
  /** UTC. When access ends (Leaving) or ended (Deactivated). */
  accessEndsAt?: string;
  /** UTC. When an invitation link stops working; only while invited. */
  invitationExpiresAt?: string;
  mfaEnrolled: boolean;
  /** A doctor's licence number (FR-STF-05). */
  licenseNo?: string;
  /** A doctor's booked visits still to come: they need reassigning when the doctor leaves. */
  upcomingAppointments: number;
}

export interface StaffFilter {
  text?: string;
  role?: StaffRole;
  branchId?: string;
  status?: StaffStatus;
}

/** Managers can't hand out the Admin or Manager role (FR-STF-01); admins grant every role. */
export function grantableRoles(grantor: CurrentUser): StaffRole[] {
  if (hasRole(grantor, 'Admin')) return [...STAFF_ROLES];
  return STAFF_ROLES.filter((role) => role !== 'Admin' && role !== 'Manager');
}

/** The branches of a member's branch-scoped roles; `'all'` when any role covers the organization. */
export function branchCoverage(roles: RoleAssignment[]): string[] | 'all' {
  if (roles.some((r) => r.scope === 'Organization')) return 'all';
  return [...new Set(roles.flatMap((r) => r.branchIds ?? []))];
}

/** Why a set of role assignments can't be saved, as a `staff:roles.errors.*` key; null when it can. */
export function rolesProblem(roles: RoleAssignment[]): 'noRole' | 'noBranch' | null {
  if (roles.length === 0) return 'noRole';
  if (roles.some((r) => r.scope === 'Branch' && (r.branchIds ?? []).length === 0)) return 'noBranch';
  return null;
}

/** The invitation form's fields; roles are checked with `rolesProblem`. Messages are `common:validation.*` keys. */
export const inviteSchema = z.object({
  fullName: z.string().trim().min(1, 'validation.required').max(100, 'validation.maxLength'),
  email: z.string().trim().min(1, 'validation.required').email('validation.email'),
});

export type InviteValues = z.infer<typeof inviteSchema>;
