import { can } from '@/features/auth/model/access';
import { isActiveAt, requirePermission, sessionUser, toCurrentUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import type { Permission } from '@/features/auth/model/permissions';
import type { CurrentUser, Role, RoleAssignment } from '@/features/auth/model/user';
import { delay, type MockDb } from '@/mocks/db';
import { MATRIX } from '@/mocks/seed/role-permissions';
import type { InvitationSeed } from '@/mocks/seed/invitations';
import type { UserSeed } from '@/mocks/seed/users';
import { ServiceError } from '@/shared/api/service-error';
import { todayIn, wallClockToUtc } from '@/shared/lib/branch-time';
import { STAFF_ROLES, branchCoverage, grantableRoles, rolesProblem, type StaffMember, type StaffRole } from '../model/staff';
import type { RolesService, StaffService } from './staff.service';

const INVITATION_HOURS = 72;
const CLINIC_ZONE = 'Africa/Cairo';
const UPCOMING = ['Pending', 'Confirmed'];

const isStaff = (user: UserSeed) => user.roles.some((r) => r.role !== 'Patient');
const staffRolesOf = (roles: RoleAssignment[]) => roles.filter((r) => r.role !== 'Patient');

function fromUser(db: MockDb, user: UserSeed, now: Date): StaffMember {
  const doctor = db.doctors.find((d) => d.userId === user.id);
  const today = todayIn(CLINIC_ZONE, now);
  const ends = user.accessEndsAt;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roles: staffRolesOf(user.roles).map((r) => ({ ...r, branchIds: r.branchIds && [...r.branchIds] })),
    status: !ends ? 'Active' : isActiveAt(user, now) ? 'Leaving' : 'Deactivated',
    accessEndsAt: ends,
    mfaEnrolled: user.mfaEnrolled,
    licenseNo: doctor?.licenseNo,
    upcomingAppointments: doctor
      ? db.appointments.filter((a) => a.doctorId === doctor.id && a.date >= today && UPCOMING.includes(a.status)).length
      : 0,
  };
}

const fromInvitation = (invitation: InvitationSeed): StaffMember => ({
  id: invitation.id,
  fullName: invitation.fullName,
  email: invitation.email,
  roles: invitation.roles.map((r) => ({ ...r, branchIds: r.branchIds && [...r.branchIds] })),
  status: 'Invited',
  invitationExpiresAt: invitation.expiresAt,
  mfaEnrolled: false,
  upcomingAppointments: 0,
});

export function createMockStaffService(deps: AuthMockDeps): StaffService {
  const { db, latencyMs, now } = deps;

  const openInvitations = () => db.invitations.filter((i) => !i.acceptedAt && !i.revokedAt);
  const everyone = () => [
    ...db.users.filter(isStaff).map((u) => fromUser(db, u, now())),
    ...openInvitations().map(fromInvitation),
  ];

  const orgWide = (user: CurrentUser, permission: Permission) =>
    user.permissions.some((g) => g.permission === permission && g.scope === 'Organization');

  /** The caller's `staff.view` scope: organization-wide, or members holding a role in one of their branches. */
  function visibleTo(member: StaffMember) {
    const viewer = toCurrentUser(db, sessionUser(deps));
    if (orgWide(viewer, 'staff.view')) return true;
    const coverage = branchCoverage(member.roles);
    return coverage !== 'all' && coverage.some((branchId) => can(viewer, 'staff.view', branchId));
  }

  function find(staffId: string) {
    const member = everyone().find((m) => m.id === staffId);
    if (!member || !visibleTo(member)) throw new ServiceError('Staff.NotFound');
    return member;
  }

  /** Only roles the caller may grant, at branches they cover (FR-STF-01). */
  function checkGrant(roles: RoleAssignment[]) {
    const grantor = toCurrentUser(db, requirePermission(deps, 'staff.invite'));
    const allowed = grantableRoles(grantor);
    if (rolesProblem(roles) || roles.some((r) => !allowed.includes(r.role as StaffRole))) throw new ServiceError('Staff.RoleNotGrantable');
    for (const r of roles) {
      const covered = r.scope === 'Organization' ? orgWide(grantor, 'staff.invite') : (r.branchIds ?? []).every((b) => can(grantor, 'staff.invite', b));
      if (!covered) throw new ServiceError('Access.OutOfScope');
    }
  }

  const userOf = (staffId: string) => db.users.find((u) => u.id === staffId);
  const invitationOf = (staffId: string) => openInvitations().find((i) => i.id === staffId);

  return {
    async list(filter, { page, pageSize }) {
      await delay(latencyMs);
      requirePermission(deps, 'staff.view');
      const text = filter.text?.trim().toLowerCase();
      const items = everyone()
        .filter(visibleTo)
        .filter((m) => !text || [m.fullName, m.email ?? '', m.phone ?? ''].some((v) => v.toLowerCase().includes(text)))
        .filter((m) => !filter.role || m.roles.some((r) => r.role === filter.role))
        .filter((m) => {
          if (!filter.branchId) return true;
          const coverage = branchCoverage(m.roles);
          return coverage === 'all' || coverage.includes(filter.branchId);
        })
        .filter((m) => !filter.status || m.status === filter.status)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
      return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length };
    },

    async get(staffId) {
      await delay(latencyMs);
      requirePermission(deps, 'staff.view');
      return find(staffId);
    },

    async invite({ fullName, email, roles }) {
      await delay(latencyMs);
      checkGrant(roles);
      const normalized = email.trim().toLowerCase();
      if (db.users.some((u) => u.email?.toLowerCase() === normalized) || openInvitations().some((i) => i.email.toLowerCase() === normalized)) {
        throw new ServiceError('Auth.EmailAlreadyExists');
      }
      const invitation: InvitationSeed = {
        id: `inv-${crypto.randomUUID()}`,
        token: crypto.randomUUID(),
        email: email.trim(),
        fullName: fullName.trim(),
        roles,
        invitedByUserId: sessionUser(deps).id,
        expiresAt: new Date(now().getTime() + INVITATION_HOURS * 3_600_000).toISOString(),
      };
      db.invitations.push(invitation);
      return fromInvitation(invitation);
    },

    async resendInvitation(staffId) {
      await delay(latencyMs);
      requirePermission(deps, 'staff.invite');
      const invitation = invitationOf(staffId);
      if (!invitation) throw new ServiceError('Invitation.NotFound');
      // A new link: the old one stops working
      invitation.token = crypto.randomUUID();
      invitation.expiresAt = new Date(now().getTime() + INVITATION_HOURS * 3_600_000).toISOString();
      return fromInvitation(invitation);
    },

    async revokeInvitation(staffId) {
      await delay(latencyMs);
      requirePermission(deps, 'staff.invite');
      const invitation = invitationOf(staffId);
      if (!invitation) throw new ServiceError('Invitation.NotFound');
      invitation.revokedAt = now().toISOString();
    },

    async setRoles(staffId, roles) {
      await delay(latencyMs);
      checkGrant(roles);
      find(staffId);
      if (staffId === sessionUser(deps).id) throw new ServiceError('Staff.CannotChangeOwnAccess');
      const user = userOf(staffId);
      const invitation = invitationOf(staffId);
      // The patient capacity of an account isn't a staff role, so it stays
      if (user) user.roles = [...user.roles.filter((r) => r.role === 'Patient'), ...roles];
      else if (invitation) invitation.roles = roles;
      return find(staffId);
    },

    async deactivate(staffId, endDate) {
      await delay(latencyMs);
      requirePermission(deps, 'staff.deactivate');
      const member = find(staffId);
      if (staffId === sessionUser(deps).id) throw new ServiceError('Staff.CannotChangeOwnAccess');
      const user = userOf(staffId);
      if (!user || member.status === 'Deactivated') throw new ServiceError('Staff.AlreadyDeactivated');
      if (endDate && endDate < todayIn(CLINIC_ZONE, now())) throw new ServiceError('Staff.EndDateInPast');
      // On an end date, access ends when that day is over in the clinic's zone
      user.accessEndsAt = endDate ? wallClockToUtc(endDate, '23:59', CLINIC_ZONE).toISOString() : now().toISOString();
      return find(staffId);
    },

    async resetMfa(staffId) {
      await delay(latencyMs);
      requirePermission(deps, 'staff.deactivate');
      find(staffId);
      const user = userOf(staffId);
      if (!user) throw new ServiceError('Staff.NotFound');
      user.mfaEnrolled = false;
      user.recoveryCodes = [];
      user.pendingMfaSecret = undefined;
      return find(staffId);
    },
  };
}

export function createMockRolesService(deps: AuthMockDeps): RolesService {
  return {
    async getMatrix() {
      await delay(deps.latencyMs);
      requirePermission(deps, 'roles.manage');
      return (STAFF_ROLES as readonly Role[]).map((role) => ({ role, grants: { ...MATRIX[role] } }));
    },
  };
}
