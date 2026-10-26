import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { invalidateFrontDesk } from '@/features/desk/hooks/front-desk-cache';
import type { TriageForm } from '../model/vitals';

export const triageKeys = {
  one: (appointmentId: string) => ['triage', appointmentId] as const,
};

export function useTriageCase(appointmentId: string) {
  const { triage } = useServices();
  // A saved draft must not overwrite what the nurse is typing, so this loads once per visit
  return useQuery({ queryKey: triageKeys.one(appointmentId), queryFn: () => triage.get(appointmentId), staleTime: Infinity });
}

export function useSaveTriageDraft(appointmentId: string) {
  const { triage } = useServices();
  return useMutation({ mutationFn: (form: TriageForm) => triage.saveDraft(appointmentId, form) });
}

export function useSubmitTriage(appointmentId: string) {
  const { triage } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (form: TriageForm) => triage.submit(appointmentId, form), onSuccess: () => void invalidateFrontDesk(queryClient) });
}
