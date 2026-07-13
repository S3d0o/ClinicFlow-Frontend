import api from './axios';
import type { Review, SubmitReviewRequest, ReviewFilterRequest } from '@/types';

export const reviewsApi = {
  submit: (data: SubmitReviewRequest) => api.post<Review>('/reviews', data),
  getDoctorReviews: (doctorId: number, params?: ReviewFilterRequest) =>
    api.get<Review[]>(`/reviews/doctor/${doctorId}`, { params }),
  delete: (id: number) => api.delete(`/reviews/${id}`),
};
