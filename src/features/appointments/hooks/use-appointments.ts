import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { useFollowLink } from '@/shared/lib/use-follow-link';
import type { BookRequest, CancelRequest, QueueStatus } from '../model/appointment';

export const appointmentKeys = {
  all: ['appointments'] as const,
  mine: ['appointments', 'mine'] as const,
  one: (id: string) => ['appointments', 'one', id] as const,
  reminder: (token: string) => ['appointments', 'reminder', token] as const,
};

export function useMyAppointments() {
  const { appointments } = useServices();
  return useQuery({ queryKey: appointmentKeys.mine, queryFn: () => appointments.listMine() });
}

export function useMyAppointment(appointmentId: string) {
  const { appointments } = useServices();
  return useQuery({ queryKey: appointmentKeys.one(appointmentId), queryFn: () => appointments.getMine(appointmentId) });
}

/** Every change to an appointment also changes the lists, the slots it held and the notifications. */
function useInvalidateAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['directory'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
}

export function useBookAppointment() {
  const { appointments } = useServices();
  const invalidate = useInvalidateAfterChange();
  return useMutation({ mutationFn: (request: BookRequest) => appointments.book(request), onSuccess: invalidate });
}

export function useRescheduleAppointment(appointmentId: string) {
  const { appointments } = useServices();
  const invalidate = useInvalidateAfterChange();
  return useMutation({ mutationFn: (slotId: string) => appointments.reschedule(appointmentId, slotId), onSuccess: invalidate });
}

export function useCancelAppointment(appointmentId: string) {
  const { appointments } = useServices();
  const invalidate = useInvalidateAfterChange();
  return useMutation({ mutationFn: (request: CancelRequest) => appointments.cancel(appointmentId, request), onSuccess: invalidate });
}

/** Starts Paymob's checkout for the optional deposit and goes there (FR-APT-08). */
export function usePayDeposit() {
  const { appointments } = useServices();
  const invalidate = useInvalidateAfterChange();
  const follow = useFollowLink();
  return useMutation({
    mutationFn: (appointmentId: string) => appointments.startDepositCheckout(appointmentId),
    onSuccess: async ({ checkoutUrl }) => {
      await invalidate();
      follow(checkoutUrl);
    },
  });
}

export function useSubmitReview(appointmentId: string) {
  const { appointments } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: { rating: number; comment?: string }) => appointments.submitReview(appointmentId, review),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
}

/**
 * The live queue place for an appointment checked in today (U3): the first update arrives at once,
 * then every change, until the component unmounts.
 */
export function useLiveQueue(appointmentId: string | undefined, initial: QueueStatus | undefined) {
  const { queue } = useServices();
  const queryClient = useQueryClient();
  const [live, setLive] = useState<{ id: string; status: QueueStatus } | null>(null);
  const hasQueue = !!initial;

  useEffect(() => {
    if (!appointmentId || !hasQueue) return;
    let first = true;
    return queue.watch(appointmentId, (status) => {
      setLive({ id: appointmentId, status });
      // Being called in changes the appointment's status too
      if (!first && status.stage === 'WithDoctor') void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      first = false;
    });
  }, [appointmentId, hasQueue, queue, queryClient]);

  return live && live.id === appointmentId ? live.status : initial;
}

export function useReminder(token: string) {
  const { reminders } = useServices();
  return useQuery({ queryKey: appointmentKeys.reminder(token), queryFn: () => reminders.get(token), retry: false });
}

export function useReminderAction(token: string, action: 'confirm' | 'cancel') {
  const { reminders } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (action === 'confirm' ? reminders.confirm(token) : reminders.cancel(token)),
    onSuccess: (view) => {
      queryClient.setQueryData(appointmentKeys.reminder(token), view);
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.mine });
    },
  });
}
