import type { Page, PageRequest } from '@/shared/api/page';
import type { DoctorProfile, DoctorSummary, Review, Slot } from '../model/doctor';

export type AvailabilityDay = 'today' | 'tomorrow' | 'week';
export type DoctorSort = 'soonest' | 'rating' | 'price';

export interface DoctorSearch extends PageRequest {
  /** Matches the doctor's name or specialty, in either language. */
  text?: string;
  branchId?: string;
  specialtyId?: string;
  /** Only doctors with a free slot on that day (or within 7 days for "week"). */
  availability?: AvailabilityDay;
  language?: string;
  sort: DoctorSort;
}

export interface SlotQuery {
  branchId: string;
  /** First day, branch-local "yyyy-MM-dd"; today at the branch when omitted. */
  from?: string;
  days: number;
}

/** The public doctor directory (`/api/v2/public/doctors`, slots and reviews). Anonymous (R1). */
export interface DirectoryService {
  searchDoctors(search: DoctorSearch): Promise<Page<DoctorSummary>>;
  getDoctor(doctorId: string): Promise<DoctorProfile>;
  getSlots(doctorId: string, query: SlotQuery): Promise<Slot[]>;
  listReviews(doctorId: string, request: PageRequest & { rating?: number }): Promise<Page<Review>>;
}
