/** A bookable time, in the branch's wall clock (ADR 0003). */
export interface Slot {
  id: string;
  doctorId: string;
  branchId: string;
  /** "yyyy-MM-dd" */
  date: string;
  /** "HH:mm" */
  startTime: string;
  endTime: string;
  startsAtUtc: string;
  available: boolean;
}

/** A doctor's weekly working hours at one branch (FR-SCH-01: several shifts per weekday allowed). */
export interface WeeklyShift {
  branchId: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  startTime: string;
  endTime: string;
}

/** A service the doctor offers, with its resolved price at each of their branches. */
export interface DoctorServiceOffer {
  serviceId: string;
  durationMinutes: number;
  prices: { branchId: string; price: number }[];
  depositAmount?: number;
}

/** A doctor in public search results (`GET /api/v2/public/doctors`). */
export interface DoctorSummary {
  id: string;
  fullName: string;
  specialtyId: string;
  branchIds: string[];
  /** Language codes the doctor consults in, e.g. "ar", "en". */
  languages: string[];
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  /** The lowest consultation price across the doctor's branches (or at the searched branch). */
  fromPrice: number | null;
  /** The next few available slots. */
  nextSlots: Slot[];
}

/** The public profile (FR-STF-05). */
export interface DoctorProfile extends DoctorSummary {
  licenseNo: string;
  bioEn?: string;
  bioAr?: string;
  services: DoctorServiceOffer[];
  schedule: WeeklyShift[];
  /** Number of reviews per star rating, 1–5. */
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
}

/** A patient review (V1 feature): written by a patient after a completed visit. */
export interface Review {
  id: string;
  /** First name and initial, e.g. "Tarek M." */
  authorName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
