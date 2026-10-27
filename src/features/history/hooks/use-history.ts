import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { saveFile } from '@/shared/lib/download';
import type { HistoryFilter } from '../model/history';

export const historyKeys = {
  one: (patientId: string, filter: HistoryFilter) => ['history', patientId, filter] as const,
};

/** The history; the previous filter's results stay on screen while the next one loads. */
export function usePatientHistory(patientId: string, filter: HistoryFilter) {
  const { history } = useServices();
  return useQuery({ queryKey: historyKeys.one(patientId, filter), queryFn: () => history.get(patientId, filter), placeholderData: keepPreviousData });
}

export function useDownloadHistory() {
  const { history } = useServices();
  return useMutation({
    mutationFn: async ({ patientId, fileName }: { patientId: string; fileName: string }) => saveFile(fileName, await history.downloadSummary(patientId)),
  });
}
