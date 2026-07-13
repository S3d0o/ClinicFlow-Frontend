import api from './axios';
import type { UserProfile, UpdateProfileRequest } from '@/types';

export const profileApi = {
  getMyProfile: () => api.get<UserProfile>('/profile/me'),
  updateProfile: (data: UpdateProfileRequest) => api.patch('/profile/me', data),
};
