import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { BranchInput, HolidayInput, RoomInput } from '../api/org-admin.service';
import type { DayHours } from '../model/branch-admin';
import type { OrganizationProfile, OrganizationSettings } from '../model/organization';
import { orgKeys } from './use-branches';

export const orgAdminKeys = {
  all: ['org-admin'] as const,
  branches: ['org-admin', 'branches'] as const,
  hours: (branchId: string) => ['org-admin', 'hours', branchId] as const,
  holidays: (branchId: string) => ['org-admin', 'holidays', branchId] as const,
  rooms: (branchId: string) => ['org-admin', 'rooms', branchId] as const,
  profile: ['org-admin', 'profile'] as const,
  settings: ['org-admin', 'settings'] as const,
};

export function useAllBranches() {
  const { branchAdmin } = useServices();
  return useQuery({ queryKey: orgAdminKeys.branches, queryFn: () => branchAdmin.list() });
}

export function useBranchHours(branchId: string) {
  const { branchAdmin } = useServices();
  return useQuery({ queryKey: orgAdminKeys.hours(branchId), queryFn: () => branchAdmin.getHours(branchId), enabled: !!branchId });
}

export function useHolidays(branchId: string) {
  const { branchAdmin } = useServices();
  return useQuery({ queryKey: orgAdminKeys.holidays(branchId), queryFn: () => branchAdmin.listHolidays(branchId), enabled: !!branchId });
}

export function useRooms(branchId: string) {
  const { branchAdmin } = useServices();
  return useQuery({ queryKey: orgAdminKeys.rooms(branchId), queryFn: () => branchAdmin.listRooms(branchId), enabled: !!branchId });
}

export function useOrganizationProfile() {
  const { organization } = useServices();
  return useQuery({ queryKey: orgAdminKeys.profile, queryFn: () => organization.getProfile() });
}

export function useOrganizationSettings() {
  const { organization } = useServices();
  return useQuery({ queryKey: orgAdminKeys.settings, queryFn: () => organization.getSettings() });
}

/** Branch changes refresh the admin's views and the public branch list everyone else reads. */
function useOrgMutation<TArgs, TResult>(run: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgAdminKeys.all });
      void queryClient.invalidateQueries({ queryKey: orgKeys.branches });
    },
  });
}

export function useSaveBranch() {
  const { branchAdmin } = useServices();
  return useOrgMutation(({ branchId, input }: { branchId?: string; input: BranchInput }) =>
    branchId ? branchAdmin.update(branchId, input) : branchAdmin.create(input)
  );
}

export function useSetBranchActive() {
  const { branchAdmin } = useServices();
  return useOrgMutation(({ branchId, active }: { branchId: string; active: boolean }) => branchAdmin.setActive(branchId, active));
}

export function useSaveHours() {
  const { branchAdmin } = useServices();
  return useOrgMutation(({ branchId, hours }: { branchId: string; hours: DayHours[] }) => branchAdmin.setHours(branchId, hours));
}

export function useAddHoliday() {
  const { branchAdmin } = useServices();
  return useOrgMutation((input: HolidayInput) => branchAdmin.addHoliday(input));
}

export function useRemoveHoliday() {
  const { branchAdmin } = useServices();
  return useOrgMutation((holidayId: string) => branchAdmin.removeHoliday(holidayId));
}

export function useSaveRoom() {
  const { branchAdmin } = useServices();
  return useOrgMutation(
    ({ branchId, roomId, input }: { branchId: string; roomId?: string; input: RoomInput & { isActive: boolean } }) =>
      roomId ? branchAdmin.updateRoom(roomId, input) : branchAdmin.addRoom(branchId, input)
  );
}

export function useSaveProfile() {
  const { organization } = useServices();
  return useOrgMutation((profile: OrganizationProfile) => organization.updateProfile(profile));
}

export function useSaveSettings() {
  const { organization } = useServices();
  return useOrgMutation((changes: Partial<OrganizationSettings>) => organization.updateSettings(changes));
}
