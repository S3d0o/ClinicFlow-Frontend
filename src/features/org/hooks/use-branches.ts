import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';

export const orgKeys = {
  branches: ['org', 'branches'] as const,
};

export function useBranches() {
  const { org } = useServices();
  return useQuery({ queryKey: orgKeys.branches, queryFn: () => org.listBranches(), staleTime: 5 * 60_000 });
}
