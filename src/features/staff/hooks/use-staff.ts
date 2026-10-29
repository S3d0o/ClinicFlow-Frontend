import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { RoleAssignment } from '@/features/auth/model/user';
import type { PageRequest } from '@/shared/api/page';
import type { InviteStaffRequest } from '../api/staff.service';
import type { StaffFilter } from '../model/staff';

export const staffKeys = {
  all: ['staff'] as const,
  list: (filter: StaffFilter, page: PageRequest) => ['staff', 'list', filter, page] as const,
  member: (staffId: string) => ['staff', 'member', staffId] as const,
  roles: ['staff', 'roles'] as const,
};

export function useStaffList(filter: StaffFilter, page: PageRequest) {
  const { staff } = useServices();
  return useQuery({ queryKey: staffKeys.list(filter, page), queryFn: () => staff.list(filter, page), placeholderData: keepPreviousData });
}

export function useStaffMember(staffId: string) {
  const { staff } = useServices();
  return useQuery({ queryKey: staffKeys.member(staffId), queryFn: () => staff.get(staffId) });
}

export function useRoleMatrix() {
  const { roles } = useServices();
  return useQuery({ queryKey: staffKeys.roles, queryFn: () => roles.getMatrix(), staleTime: Infinity });
}

/** Every staff change refreshes the directory and the member. */
function useStaffMutation<TArgs, TResult>(run: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: run, onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }) });
}

export function useInviteStaff() {
  const { staff } = useServices();
  return useStaffMutation((request: InviteStaffRequest) => staff.invite(request));
}

export function useResendInvitation() {
  const { staff } = useServices();
  return useStaffMutation((staffId: string) => staff.resendInvitation(staffId));
}

export function useRevokeInvitation() {
  const { staff } = useServices();
  return useStaffMutation((staffId: string) => staff.revokeInvitation(staffId));
}

export function useSetStaffRoles() {
  const { staff } = useServices();
  return useStaffMutation(({ staffId, roles }: { staffId: string; roles: RoleAssignment[] }) => staff.setRoles(staffId, roles));
}

export function useDeactivateStaff() {
  const { staff } = useServices();
  return useStaffMutation(({ staffId, endDate }: { staffId: string; endDate?: string }) => staff.deactivate(staffId, endDate));
}

export function useResetMfa() {
  const { staff } = useServices();
  return useStaffMutation((staffId: string) => staff.resetMfa(staffId));
}
