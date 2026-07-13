import api from './axios';
import type { Specialty } from '@/types';

export const specialtiesApi = {
  getAll: (includeInactive?: boolean) =>
    api.get<Specialty[]>('/specialty', { params: { includeInactive } }),
  getById: (id: number) => api.get<Specialty>(`/specialty/${id}`),
};
