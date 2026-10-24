import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { authKeys } from '@/features/auth/hooks/use-session';
import { openFile } from '@/shared/lib/download';
import type { ApplyRequest } from '../api/applications.service';

export const applicationKeys = {
  mine: ['recruitment', 'mine'] as const,
};

export function useMyApplication(enabled = true) {
  const { applications } = useServices();
  return useQuery({ queryKey: applicationKeys.mine, queryFn: () => applications.getMine(), enabled });
}

/** Submitting makes the user an applicant, so the session is refreshed too. */
export function useApply() {
  const { applications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ApplyRequest) => applications.apply(request),
    onSuccess: async (application) => {
      queryClient.setQueryData(applicationKeys.mine, application);
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useWithdrawApplication() {
  const { applications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => applications.withdraw(),
    onSuccess: (application) => queryClient.setQueryData(applicationKeys.mine, application),
  });
}

/** Opens one of the application's files in a new tab (the browser shows or saves it). */
export function useOpenApplicationFile() {
  const { applications } = useServices();
  return useMutation({
    mutationFn: async (fileId: string) => openFile(await applications.downloadFile(fileId)),
  });
}
