import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { invalidateFrontDesk } from '@/features/desk/hooks/front-desk-cache';
import { saveFile } from '@/shared/lib/download';
import type { Checkout, CollectRequest } from '../model/checkout';

export const checkoutKeys = {
  open: (branchId: string) => ['checkout', 'open', branchId] as const,
  one: (appointmentId: string) => ['checkout', 'one', appointmentId] as const,
};

export const cashKeys = {
  current: ['cash', 'current'] as const,
  drawers: (branchId: string) => ['cash', 'drawers', branchId] as const,
};

export function useOpenCheckouts(branchId: string | null) {
  const { checkout } = useServices();
  return useQuery({ queryKey: checkoutKeys.open(branchId ?? ''), queryFn: () => checkout.listOpen(branchId!), enabled: !!branchId });
}

export function useCheckout(appointmentId: string | null) {
  const { checkout } = useServices();
  return useQuery({ queryKey: checkoutKeys.one(appointmentId ?? ''), queryFn: () => checkout.get(appointmentId!), enabled: !!appointmentId });
}

/** Adding or removing a line answers with the new checkout, shown at once. */
function useLineChange<TInput>(appointmentId: string, run: (input: TInput) => Promise<Checkout>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (checkout) => queryClient.setQueryData(checkoutKeys.one(appointmentId), checkout),
  });
}

export function useAddLine(appointmentId: string) {
  const { checkout } = useServices();
  return useLineChange(appointmentId, (serviceId: string) => checkout.addLine(appointmentId, serviceId));
}

export function useRemoveLine(appointmentId: string) {
  const { checkout } = useServices();
  return useLineChange(appointmentId, (lineId: string) => checkout.removeLine(appointmentId, lineId));
}

export function useCollect(appointmentId: string) {
  const { checkout } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CollectRequest) => checkout.collect(appointmentId, request),
    onSuccess: () => void invalidateFrontDesk(queryClient),
  });
}

export function useDownloadReceipt() {
  const { checkout } = useServices();
  return useMutation({
    mutationFn: async ({ paymentId, fileName }: { paymentId: string; fileName: string }) => saveFile(fileName, await checkout.downloadReceipt(paymentId)),
  });
}

export function useCurrentCashSession() {
  const { cashSessions } = useServices();
  return useQuery({ queryKey: cashKeys.current, queryFn: () => cashSessions.current() });
}

export function useDrawers(branchId: string | null) {
  const { cashSessions } = useServices();
  return useQuery({ queryKey: cashKeys.drawers(branchId ?? ''), queryFn: () => cashSessions.listDrawers(branchId!), enabled: !!branchId });
}

export function useOpenCashSession() {
  const { cashSessions } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: { drawerId: string; openingFloat: number }) => cashSessions.open(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash'] }),
  });
}

export function useCloseCashSession() {
  const { cashSessions } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, countedAmount, note }: { sessionId: string; countedAmount: number; note?: string }) =>
      cashSessions.close(sessionId, { countedAmount, note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash'] }),
  });
}

export function useDownloadCashReport() {
  const { cashSessions } = useServices();
  return useMutation({
    mutationFn: async ({ sessionId, fileName }: { sessionId: string; fileName: string }) => saveFile(fileName, await cashSessions.downloadReport(sessionId)),
  });
}
