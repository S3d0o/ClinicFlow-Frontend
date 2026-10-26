import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { DeskBookRequest, WalkInRequest } from '../model/desk';
import { invalidateFrontDesk } from './front-desk-cache';

export const deskKeys = {
  day: (branchId: string, date: string) => ['desk', 'day', branchId, date] as const,
  checkIn: (appointmentId: string) => ['desk', 'check-in', appointmentId] as const,
  upcoming: (patientId: string) => ['desk', 'upcoming', patientId] as const,
};

/** The branch's day; refreshed every minute so late arrivals show without a reload. */
export function useDeskDay(branchId: string | null, date: string) {
  const { desk } = useServices();
  return useQuery({
    queryKey: deskKeys.day(branchId ?? '', date),
    queryFn: () => desk.listDay(branchId!, date),
    enabled: !!branchId,
    refetchInterval: 60_000,
  });
}

export function useUpcomingVisits(patientId: string | null) {
  const { desk } = useServices();
  return useQuery({ queryKey: deskKeys.upcoming(patientId ?? ''), queryFn: () => desk.listUpcomingFor(patientId!), enabled: !!patientId });
}

export function useCheckInView(appointmentId: string | null) {
  const { desk } = useServices();
  return useQuery({ queryKey: deskKeys.checkIn(appointmentId ?? ''), queryFn: () => desk.getCheckIn(appointmentId!), enabled: !!appointmentId });
}

/** A mutation that refreshes every front desk screen once it succeeds. */
function useDeskMutation<TInput, TResult>(run: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: run, onSuccess: () => void invalidateFrontDesk(queryClient) });
}

export function useCheckIn() {
  const { desk } = useServices();
  return useDeskMutation((appointmentId: string) => desk.checkIn(appointmentId));
}

export function useMarkNoShow() {
  const { desk } = useServices();
  return useDeskMutation((appointmentId: string) => desk.markNoShow(appointmentId));
}

export function useDeskBook() {
  const { desk } = useServices();
  return useDeskMutation((request: DeskBookRequest) => desk.book(request));
}

export function useWalkIn() {
  const { desk } = useServices();
  return useDeskMutation((request: WalkInRequest) => desk.walkIn(request));
}
