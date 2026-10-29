import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { Bilingual } from '@/shared/i18n/bilingual';

// Reference data changes rarely, so it stays fresh for the session.
const REFERENCE_STALE_MS = 10 * 60_000;

export const catalogKeys = {
  specialties: ['catalog', 'specialties'] as const,
  services: ['catalog', 'services'] as const,
};

export function useSpecialties() {
  const { catalog } = useServices();
  return useQuery({ queryKey: catalogKeys.specialties, queryFn: () => catalog.listSpecialties(), staleTime: REFERENCE_STALE_MS });
}

export function useServiceCatalog() {
  const { catalog } = useServices();
  return useQuery({ queryKey: catalogKeys.services, queryFn: () => catalog.listServices(), staleTime: REFERENCE_STALE_MS });
}

/** Adds a specialty, or renames one (`specialties.manage`). */
export function useSaveSpecialty() {
  const { specialtyAdmin } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id?: string; value: Bilingual }) => (id ? specialtyAdmin.update(id, value) : specialtyAdmin.create(value)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.specialties }),
  });
}
