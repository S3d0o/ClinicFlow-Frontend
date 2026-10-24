import { useMutation } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { MfaProof, SignInRequest } from '../api/auth.service';
import { useSetSessionUser } from './use-session';

/** Password step. A patient is signed in at once; staff get a two-step challenge. */
export function useSignIn() {
  const { auth } = useServices();
  const setSessionUser = useSetSessionUser();
  return useMutation({
    mutationFn: (request: SignInRequest) => auth.signIn(request),
    onSuccess: (result) => {
      if (result.status === 'signed-in') setSessionUser(result.user);
    },
  });
}

/** Two-step code (or a recovery code) for a pending challenge. */
export function useVerifyMfa() {
  const { auth } = useServices();
  const setSessionUser = useSetSessionUser();
  return useMutation({
    mutationFn: ({ challengeId, proof }: { challengeId: string; proof: MfaProof }) => auth.verifyMfa(challengeId, proof),
    onSuccess: setSessionUser,
  });
}
