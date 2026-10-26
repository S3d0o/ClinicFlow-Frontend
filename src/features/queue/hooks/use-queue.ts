import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { invalidateFrontDesk } from '@/features/desk/hooks/front-desk-cache';

export const queueKeys = {
  board: (branchId: string) => ['queue', 'board', branchId] as const,
  display: (branchId: string) => ['queue', 'display', branchId] as const,
};

/**
 * Keeps the screen live (FR-FD-04): every change to the branch's queue, from this screen or anyone
 * else's, refreshes the front desk data. The HTTP adapter will listen on `/hubs/queue`.
 */
export function useQueueLive(branchId: string | null | undefined) {
  const { queueBoard } = useServices();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!branchId) return;
    return queueBoard.subscribe(branchId, () => void invalidateFrontDesk(queryClient));
  }, [branchId, queueBoard, queryClient]);
}

/** Today's queue. Waits are recomputed from the clock, so a refetch is needed only on changes. */
export function useQueueBoard(branchId: string | null | undefined) {
  const { queueBoard } = useServices();
  return useQuery({ queryKey: queueKeys.board(branchId ?? ''), queryFn: () => queueBoard.board(branchId!), enabled: !!branchId });
}

export function useWaitingDisplay(branchId: string) {
  const { queueBoard } = useServices();
  // The TV may lose a push while offline, so it also refreshes every minute
  return useQuery({ queryKey: queueKeys.display(branchId), queryFn: () => queueBoard.display(branchId), refetchInterval: 60_000 });
}

export function useCallPatient() {
  const { queueBoard } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (appointmentId: string) => queueBoard.call(appointmentId), onSuccess: () => void invalidateFrontDesk(queryClient) });
}

export function useMoveToFront() {
  const { queueBoard } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: string; reason: string }) => queueBoard.moveToFront(appointmentId, reason),
    onSuccess: () => void invalidateFrontDesk(queryClient),
  });
}
