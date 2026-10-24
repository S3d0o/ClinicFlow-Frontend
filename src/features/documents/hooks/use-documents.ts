import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { saveFile } from '@/shared/lib/download';
import type { AddPolicyRequest } from '../model/documents';

export const documentKeys = {
  documents: ['documents', 'mine'] as const,
  policies: ['insurance', 'mine'] as const,
  payers: ['insurance', 'payers'] as const,
};

export function useMyDocuments() {
  const { documents } = useServices();
  return useQuery({ queryKey: documentKeys.documents, queryFn: () => documents.listMine() });
}

export function useUploadDocument() {
  const { documents } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documents.upload(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.documents }),
  });
}

export function useRemoveDocument() {
  const { documents } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documents.remove(documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.documents }),
  });
}

export function useDownloadDocument() {
  const { documents } = useServices();
  return useMutation({
    mutationFn: async ({ documentId, fileName }: { documentId: string; fileName: string }) =>
      saveFile(fileName, await documents.download(documentId)),
  });
}

export function useMyPolicies() {
  const { insurance } = useServices();
  return useQuery({ queryKey: documentKeys.policies, queryFn: () => insurance.listMine() });
}

export function usePayers(enabled: boolean) {
  const { insurance } = useServices();
  return useQuery({ queryKey: documentKeys.payers, queryFn: () => insurance.listPayers(), enabled, staleTime: 10 * 60_000 });
}

export function useAddPolicy() {
  const { insurance } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AddPolicyRequest) => insurance.add(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.policies }),
  });
}
