import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { CurrentUser } from '../model/user';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/** The signed-in user (`null` when signed out), loaded once and kept until sign-in or sign-out. */
export function useSession() {
  const { auth } = useServices();
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: () => auth.getCurrentUser(),
    staleTime: Infinity,
  });
  return { user: query.data ?? null, isLoading: query.isPending, error: query.error };
}

/** Stores a freshly signed-in user as the session. */
export function useSetSessionUser() {
  const queryClient = useQueryClient();
  return (user: CurrentUser) => queryClient.setQueryData(authKeys.me, user);
}

/** Signs out and drops every cached response, so the next user never sees the previous one's data. */
export function useSignOut() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auth.signOut(),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}
