import api from './axios';
import type { DoctorSummary, Specialty, CreateSpecialtyRequest, AdminOverviewStats, AdminAppointmentStats,  } from '@/types';

export const adminApi = {
  getPendingDoctors: () => api.get<DoctorSummary[]>('/admin/doctors/pending'),
  approveDoctor: (id: number) => api.post(`/admin/doctors/${id}/approve`),
  suspendDoctor: (id: number) => api.post(`/admin/doctors/${id}/suspend`),
  getAllSpecialties: () => api.get<Specialty[]>('/admin/specialties'),
  createSpecialty: (data: CreateSpecialtyRequest) =>
    api.post<Specialty>('/admin/specialties', data),
  updateSpecialty: (id: number, data: CreateSpecialtyRequest) =>
    api.put<Specialty>(`/admin/specialties/${id}`, data),
  deleteSpecialty: (id: number) => api.delete(`/admin/specialties/${id}`),
  getOverviewStats: () => api.get<AdminOverviewStats>('/admin/stats/overview'),
  getAppointmentStats: () => api.get<AdminAppointmentStats>('/admin/stats/appointments'),
};
