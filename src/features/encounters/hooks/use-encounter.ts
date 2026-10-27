import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { invalidateFrontDesk } from '@/features/desk/hooks/front-desk-cache';
import type { Encounter, EncounterDraft } from '../model/encounter';

export const encounterKeys = {
  one: (appointmentId: string) => ['encounters', 'one', appointmentId] as const,
  icd10: (query: string) => ['encounters', 'icd10', query] as const,
  drugs: (query: string) => ['encounters', 'drugs', query] as const,
  catalog: ['encounters', 'drug-catalog'] as const,
  templates: (specialtyId: string) => ['encounters', 'templates', specialtyId] as const,
};

/** Reference data that rarely changes stays fresh for the session. */
const REFERENCE_STALE_MS = 10 * 60_000;

/** The encounter, loaded once: the page keeps the doctor's edits locally and autosaves them. */
export function useEncounter(appointmentId: string) {
  const { encounters } = useServices();
  return useQuery({ queryKey: encounterKeys.one(appointmentId), queryFn: () => encounters.get(appointmentId), staleTime: Infinity });
}

export function useSaveEncounter(appointmentId: string) {
  const { encounters } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draft, rowVersion }: { draft: EncounterDraft; rowVersion: number }) => encounters.saveDraft(appointmentId, draft, rowVersion),
    onSuccess: (encounter) => queryClient.setQueryData(encounterKeys.one(appointmentId), encounter),
  });
}

/** Signing, completing and addenda change the visit too, so every front desk and doctor screen refreshes. */
function useEncounterAction<TInput>(appointmentId: string, run: (input: TInput) => Promise<Encounter>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (encounter) => {
      queryClient.setQueryData(encounterKeys.one(appointmentId), encounter);
      void invalidateFrontDesk(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['doctor'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useSignEncounter(appointmentId: string) {
  const { encounters } = useServices();
  return useEncounterAction(appointmentId, (rowVersion: number) => encounters.sign(appointmentId, rowVersion));
}

export function useCompleteVisit(appointmentId: string) {
  const { encounters } = useServices();
  return useEncounterAction(appointmentId, () => encounters.completeVisit(appointmentId));
}

export function useAddAddendum(appointmentId: string) {
  const { encounters } = useServices();
  return useEncounterAction(appointmentId, (text: string) => encounters.addAddendum(appointmentId, text));
}

export function useIcd10Search(query: string) {
  const { encounters } = useServices();
  const q = query.trim();
  return useQuery({ queryKey: encounterKeys.icd10(q), queryFn: () => encounters.searchIcd10(q), enabled: q.length >= 2, placeholderData: keepPreviousData });
}

export function useDrugSearch(query: string) {
  const { encounters } = useServices();
  const q = query.trim();
  return useQuery({ queryKey: encounterKeys.drugs(q), queryFn: () => encounters.searchDrugs(q), enabled: q.length >= 2, placeholderData: keepPreviousData });
}

/** The whole drug catalog, for the allergy check on free-text and picked medicines alike. */
export function useDrugCatalog() {
  const { encounters } = useServices();
  return useQuery({ queryKey: encounterKeys.catalog, queryFn: () => encounters.listDrugs(), staleTime: REFERENCE_STALE_MS });
}

export function useTemplates(specialtyId: string | undefined) {
  const { encounters } = useServices();
  return useQuery({
    queryKey: encounterKeys.templates(specialtyId ?? ''),
    queryFn: () => encounters.listTemplates(specialtyId!),
    enabled: !!specialtyId,
    staleTime: REFERENCE_STALE_MS,
  });
}
