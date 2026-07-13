import api from './axios';
import type { DoctorSummary, DoctorDetails, Slot, Review, ReviewFilterRequest, DoctorFilterRequest, UpdateDoctorProfileRequest, Schedule, CreateScheduleRequest, UpdateScheduleRequest,  } from '@/types';

export const doctorsApi = {
  list: (params?: DoctorFilterRequest) =>
    api.get<DoctorSummary[]>('/doctors', { params }),
  getById: (id: number) => api.get<DoctorDetails>(`/doctors/${id}`),
  getSlots: (id: number, date: string) =>
    api.get<Slot[]>(`/doctors/${id}/slots`, { params: { date } }),
  getReviews: (id: number, params?: ReviewFilterRequest) =>
    api.get<Review[]>(`/doctors/${id}/reviews`, { params }),
  updateProfile: (data: UpdateDoctorProfileRequest) =>
    api.put('/doctors/profile', data),
  getSchedules: () => api.get<Schedule[]>('/doctors/schedule'),
  createSchedule: (data: CreateScheduleRequest) =>
    api.post<Schedule>('/doctors/schedule', data),
  updateSchedule: (id: number, data: UpdateScheduleRequest) =>
    api.put<Schedule>(`/doctors/schedule/${id}`, data),
  deleteSchedule: (id: number) => api.delete(`/doctors/schedule/${id}`),
};
