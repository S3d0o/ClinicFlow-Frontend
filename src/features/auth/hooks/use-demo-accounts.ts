import { useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { useSetSessionUser } from './use-session';

/** Demo accounts. `available` is false when the backend wired in has none (the real API). */
export function useDemoAccounts() {
  const { demoAccounts } = useServices();
  const query = useQuery({
    queryKey: ['auth', 'demo-accounts'],
    queryFn: () => demoAccounts!.list(),
    enabled: !!demoAccounts,
  });
  return { ...query, available: !!demoAccounts };
}

export function useDemoSignIn() {
  const { demoAccounts } = useServices();
  const setSessionUser = useSetSessionUser();
  return useMutation({
    mutationFn: (userId: string) => demoAccounts!.signInAs(userId),
    onSuccess: setSessionUser,
  });
}
