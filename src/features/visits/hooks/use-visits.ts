import { useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { saveFile } from '@/shared/lib/download';

export const visitKeys = {
  mine: ['visits', 'mine'] as const,
  one: (id: string) => ['visits', 'one', id] as const,
};

export function useMyVisits() {
  const { visits } = useServices();
  return useQuery({ queryKey: visitKeys.mine, queryFn: () => visits.listMine() });
}

export function useVisit(visitId: string) {
  const { visits } = useServices();
  return useQuery({ queryKey: visitKeys.one(visitId), queryFn: () => visits.getMine(visitId) });
}

export function useDownloadPrescription() {
  const { visits } = useServices();
  return useMutation({
    mutationFn: async ({ visitId, fileName }: { visitId: string; fileName: string }) =>
      saveFile(fileName, await visits.downloadPrescription(visitId)),
  });
}
