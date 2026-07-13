import api from './axios';
import type { PatientProfile, UpdatePatientProfileRequest } from '@/types';

export const patientApi = {
  getProfile: () => api.get<PatientProfile>('/patients/profile'),
  updateProfile: (data: UpdatePatientProfileRequest) =>
    api.patch('/patients/profile', data),
};
