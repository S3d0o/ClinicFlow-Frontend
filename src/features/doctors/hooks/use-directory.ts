import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { PageRequest } from '@/shared/api/page';
import type { DoctorSearch, SlotQuery } from '../api/directory.service';

export const directoryKeys = {
  search: (search: DoctorSearch) => ['directory', 'search', search] as const,
  doctor: (doctorId: string) => ['directory', 'doctor', doctorId] as const,
  slots: (doctorId: string, query: SlotQuery) => ['directory', 'slots', doctorId, query] as const,
  reviews: (doctorId: string, request: PageRequest & { rating?: number }) => ['directory', 'reviews', doctorId, request] as const,
};

/** Search results. The previous page stays on screen while the next one loads. */
export function useDoctorSearch(search: DoctorSearch) {
  const { directory } = useServices();
  return useQuery({
    queryKey: directoryKeys.search(search),
    queryFn: () => directory.searchDoctors(search),
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(doctorId: string) {
  const { directory } = useServices();
  return useQuery({ queryKey: directoryKeys.doctor(doctorId), queryFn: () => directory.getDoctor(doctorId) });
}

export function useDoctorSlots(doctorId: string, query: SlotQuery | null) {
  const { directory } = useServices();
  return useQuery({
    queryKey: directoryKeys.slots(doctorId, query ?? { branchId: '', days: 0 }),
    queryFn: () => directory.getSlots(doctorId, query!),
    enabled: !!query,
  });
}

/** The services bookable at a branch, with their lowest price there (booking step 1). */
export function useBranchServices(branchId: string | undefined) {
  const { directory } = useServices();
  return useQuery({
    queryKey: ['directory', 'branch-services', branchId ?? ''],
    queryFn: () => directory.listBranchServices(branchId!),
    enabled: !!branchId,
  });
}

export function useDoctorReviews(doctorId: string, request: PageRequest & { rating?: number }) {
  const { directory } = useServices();
  return useQuery({
    queryKey: directoryKeys.reviews(doctorId, request),
    queryFn: () => directory.listReviews(doctorId, request),
    placeholderData: keepPreviousData,
  });
}
