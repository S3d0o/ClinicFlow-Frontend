import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { authKeys } from '@/features/auth/hooks/use-session';
import type { Language } from '@/shared/i18n/languages';
import type { NotificationChannel, PatientProfile } from '../model/profile';

export const profileKeys = {
  mine: ['profile', 'mine'] as const,
};

export function useMyProfile() {
  const { profile } = useServices();
  return useQuery({ queryKey: profileKeys.mine, queryFn: () => profile.getMine() });
}

/** Profile changes also change what `/me` returns (phone, language). */
function useStoreProfile() {
  const queryClient = useQueryClient();
  return (updated: PatientProfile) => {
    queryClient.setQueryData(profileKeys.mine, updated);
    void queryClient.invalidateQueries({ queryKey: authKeys.me });
  };
}

export function useUpdatePreferences() {
  const { profile } = useServices();
  const store = useStoreProfile();
  return useMutation({
    mutationFn: (changes: { notificationChannel?: NotificationChannel; preferredLanguage?: Language }) => profile.updatePreferences(changes),
    onSuccess: store,
  });
}

export function useRequestPhoneChange() {
  const { profile } = useServices();
  return useMutation({ mutationFn: (newPhone: string) => profile.requestPhoneChange(newPhone) });
}

export function useConfirmPhoneChange() {
  const { profile } = useServices();
  const store = useStoreProfile();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => profile.confirmPhoneChange(phone, code),
    onSuccess: store,
  });
}

export function useChangePassword() {
  const { profile } = useServices();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      profile.changePassword(currentPassword, newPassword),
  });
}
