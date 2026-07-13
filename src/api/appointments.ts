import api from './axios';
import type { Appointment, BookAppointmentRequest, CancelAppointmentRequest, AddDoctorNotesRequest, AppointmentFilterRequest,  } from '@/types';

export const appointmentsApi = {
  book: (data: BookAppointmentRequest) =>
    api.post<Appointment>('/appointments', data),
  getMyAppointments: (params?: AppointmentFilterRequest) =>
    api.get<Appointment[]>('/appointments/my', { params }),
  getDoctorAppointments: (params?: AppointmentFilterRequest) =>
    api.get<Appointment[]>('/appointments/doctor/my', { params }),
  getById: (id: number) => api.get<Appointment>(`/appointments/${id}`),
  cancel: (id: number, data?: CancelAppointmentRequest) =>
    api.post(`/appointments/${id}/cancel`, data),
  complete: (id: number) => api.post(`/appointments/${id}/complete`),
  addNotes: (id: number, data: AddDoctorNotesRequest) =>
    api.put(`/appointments/${id}/notes`, data),
};
