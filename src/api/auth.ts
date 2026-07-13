import api from './axios';
import type { LoginRequest, LoginResponse, RegisterPatientRequest, RegisterDoctorRequest, RegisterResponse, RefreshTokenRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest, ConfirmEmailRequest,  } from '@/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  registerPatient: (data: RegisterPatientRequest) =>
    api.post<RegisterResponse>('/auth/register/patient', data),
  registerDoctor: (data: RegisterDoctorRequest) =>
    api.post<RegisterResponse>('/auth/register/doctor', data),
  confirmEmail: (data: ConfirmEmailRequest) => api.post('/auth/confirm-email', data),
  refreshToken: (data: RefreshTokenRequest) => api.post<LoginResponse>('/auth/refresh-token', data),
  logout: (data: LogoutRequest) => api.post('/auth/logout', data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordRequest) => api.post('/auth/reset-password', data),
};
