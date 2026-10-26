import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { DuplicateCandidate, PatientFilter, RegisterPatientRequest } from '../model/patient';

export const patientKeys = {
  search: (query: string, filter: PatientFilter) => ['patients', 'search', query, filter] as const,
  one: (patientId: string) => ['patients', 'one', patientId] as const,
  duplicates: (candidate: DuplicateCandidate) => ['patients', 'duplicates', candidate] as const,
};

/** Searches once the text is two characters or more; earlier results stay while the next ones load. */
export function usePatientSearch(query: string, filter: PatientFilter = 'all') {
  const { patients } = useServices();
  const q = query.trim();
  return useQuery({
    queryKey: patientKeys.search(q, filter),
    queryFn: () => patients.search(q, filter),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function usePatient(patientId: string | null) {
  const { patients } = useServices();
  return useQuery({ queryKey: patientKeys.one(patientId ?? ''), queryFn: () => patients.get(patientId!), enabled: !!patientId });
}

/** Possible duplicates of what's typed so far (FR-FD-02); runs once there is a phone or a name with a birth date. */
export function useDuplicates(candidate: DuplicateCandidate, enabled: boolean) {
  const { patients } = useServices();
  return useQuery({
    queryKey: patientKeys.duplicates(candidate),
    queryFn: () => patients.findDuplicates(candidate),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useRegisterPatient() {
  const { patients } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RegisterPatientRequest) => patients.register(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}
