import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { saveFile } from '@/shared/lib/download';
import { useFollowLink } from '@/shared/lib/use-follow-link';

export const invoiceKeys = {
  mine: ['invoices', 'mine'] as const,
};

export function useMyInvoices() {
  const { billing } = useServices();
  return useQuery({ queryKey: invoiceKeys.mine, queryFn: () => billing.listMine() });
}

/** Paymob's hosted checkout for an open invoice (FR-BIL-06). */
export function usePayInvoice() {
  const { billing } = useServices();
  const queryClient = useQueryClient();
  const follow = useFollowLink();
  return useMutation({
    mutationFn: (invoiceId: string) => billing.startCheckout(invoiceId),
    onSuccess: async ({ checkoutUrl }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoiceKeys.mine }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      follow(checkoutUrl);
    },
  });
}

export function useDownloadInvoice() {
  const { billing } = useServices();
  return useMutation({
    mutationFn: async ({ invoiceId, fileName }: { invoiceId: string; fileName: string }) =>
      saveFile(fileName, await billing.downloadPdf(invoiceId)),
  });
}
