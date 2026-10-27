import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { LeaveRequestInput } from '../model/doctor-day';

export const doctorKeys = {
  day: (date: string) => ['doctor', 'day', date] as const,
  unsigned: ['doctor', 'unsigned'] as const,
  week: (weekStart: string) => ['doctor', 'week', weekStart] as const,
  leave: ['doctor', 'leave'] as const,
  impact: (input: Omit<LeaveRequestInput, 'reason'>) => ['doctor', 'leave-impact', input] as const,
};

/** The doctor's day; refreshed every minute so waits and late arrivals stay current. */
export function useDoctorDay(date: string) {
  const { doctorDay } = useServices();
  return useQuery({ queryKey: doctorKeys.day(date), queryFn: () => doctorDay.myDay(date), refetchInterval: 60_000 });
}

export function useUnsignedEncounters() {
  const { doctorDay } = useServices();
  return useQuery({ queryKey: doctorKeys.unsigned, queryFn: () => doctorDay.unsigned() });
}

export function useDoctorWeek(weekStart: string) {
  const { schedule } = useServices();
  return useQuery({ queryKey: doctorKeys.week(weekStart), queryFn: () => schedule.myWeek(weekStart) });
}

export function useMyLeave() {
  const { schedule } = useServices();
  return useQuery({ queryKey: doctorKeys.leave, queryFn: () => schedule.listMyLeave() });
}

/** What a leave would touch, once its dates are valid (FR-SCH-06). */
export function useLeaveImpact(input: Omit<LeaveRequestInput, 'reason'> | null) {
  const { schedule } = useServices();
  return useQuery({
    queryKey: doctorKeys.impact(input ?? { fromDate: '', toDate: '' }),
    queryFn: () => schedule.previewLeave(input!),
    enabled: !!input,
    retry: false,
  });
}

export function useRequestLeave() {
  const { schedule } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveRequestInput) => schedule.requestLeave(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor'] }),
  });
}

export function useCancelLeave() {
  const { schedule } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leaveId: string) => schedule.cancelLeave(leaveId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor'] }),
  });
}
