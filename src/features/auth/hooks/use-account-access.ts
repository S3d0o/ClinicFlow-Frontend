import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { OtpPurpose, RegisterRequest } from '../api/auth.service';
import { authKeys, useSetSessionUser } from './use-session';

// Sign-up, one-time codes, password reset and account email (FR-ACC-01 … FR-ACC-05).

export function useRegister() {
  const { registration } = useServices();
  return useMutation({ mutationFn: (request: RegisterRequest) => registration.register(request) });
}

export function useVerifyPhone() {
  const { registration } = useServices();
  const setSessionUser = useSetSessionUser();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => registration.verifyPhone(phone, code),
    onSuccess: setSessionUser,
  });
}

export function useSendCode() {
  const { otp } = useServices();
  return useMutation({ mutationFn: ({ phone, purpose }: { phone: string; purpose: OtpPurpose }) => otp.send(phone, purpose) });
}

export function useRequestResetEmail() {
  const { passwordReset } = useServices();
  return useMutation({ mutationFn: (email: string) => passwordReset.requestEmailLink(email) });
}

export function useCheckResetCode() {
  const { passwordReset } = useServices();
  return useMutation({ mutationFn: ({ phone, code }: { phone: string; code: string }) => passwordReset.checkCode(phone, code) });
}

/** Sets the new password with a one-time code or an email token. A reset ends every session. */
export function useResetPassword() {
  const { passwordReset } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: { password: string } & ({ phone: string; code: string } | { userId: string; token: string })) =>
      'phone' in request
        ? passwordReset.resetWithCode(request.phone, request.code, request.password)
        : passwordReset.resetWithEmailToken(request.userId, request.token, request.password),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}

export function useAddEmail() {
  const { account } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => account.addEmail(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });
}

export function useConfirmEmail() {
  const { account } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, token }: { userId: string; token: string }) => account.confirmEmail(userId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });
}
