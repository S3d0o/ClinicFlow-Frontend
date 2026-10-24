import { useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { AcceptInvitationRequest } from '../api/auth.service';
import { useSetSessionUser } from './use-session';

// Staff invitations and two-step setup (FR-STF-01, FR-STF-02, FR-STF-07).

export function useInvitation(token: string) {
  const { invitations } = useServices();
  return useQuery({ queryKey: ['auth', 'invitation', token], queryFn: () => invitations.get(token), staleTime: Infinity });
}

export function useAcceptInvitation(token: string) {
  const { invitations } = useServices();
  const setSessionUser = useSetSessionUser();
  return useMutation({
    mutationFn: (request: AcceptInvitationRequest) => invitations.accept(token, request),
    onSuccess: setSessionUser,
  });
}

/**
 * A new authenticator key and recovery codes, made once per visit to the setup screen. Never
 * refetched in the background: a new key would no longer match the app the user just scanned.
 */
export function useMfaEnrollment(enabled: boolean) {
  const { mfa } = useServices();
  return useQuery({
    queryKey: ['auth', 'mfa-enrollment'],
    queryFn: () => mfa.startEnrollment(),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useConfirmMfaEnrollment() {
  const { mfa } = useServices();
  const setSessionUser = useSetSessionUser();
  return useMutation({ mutationFn: (code: string) => mfa.confirmEnrollment(code), onSuccess: setSessionUser });
}
