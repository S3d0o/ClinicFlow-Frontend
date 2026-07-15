// ============ AUTH TYPES ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface RegisterPatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface RegisterDoctorRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth?: string;
  specialtyId: number;
  bio?: string;
  yearsOfExperience: number;
  consultationFee: number;
  clinicAddress?: string;
  clinicCity?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  userId: string;
  token: string;
  newPassword: string;
}

export interface ConfirmEmailRequest {
  userId: string;
  token: string;
}

// ============ USER TYPES ============
export type UserRole = 'Patient' | 'Doctor' | 'Admin';

export type Gender = 'Male' | 'Female';

export type BloodType =
  | 'APositive'
  | 'ANegative'
  | 'BPositive'
  | 'BNegative'
  | 'OPositive'
  | 'ONegative'
  | 'ABPositive'
  | 'ABNegative';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  gender: Gender;
  dateOfBirth?: string;
  role: UserRole;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

// ============ PATIENT TYPES ============
export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profilePictureUrl?: string;
  createdAt: string;
}

export interface UpdatePatientProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// ============ DOCTOR TYPES ============
export interface DoctorSummary {
  id: number;
  fullName: string;
  specialtyName: string;
  yearsOfExperience: number;
  consultationFee: number;
  averageRating: number;
  clinicCity: string;
}

export interface DoctorDetails {
  id: number;
  fullName: string;
  specialtyName: string;
  bio?: string;
  yearsOfExperience: number;
  consultationFee: number;
  averageRating: number;
  totalReviews: number;
  clinicAddress?: string;
  clinicCity: string;
}

export interface UpdateDoctorProfileRequest {
  bio?: string;
  consultationFee?: number;
  clinicAddress?: string;
  clinicCity?: string;
}

export interface DoctorFilterRequest {
  specialtyId?: number;
  city?: string;
  name?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: DoctorSortBy;
}

export type DoctorSortBy = 'Rating' | 'Fee' | 'Experience';

// ============ SCHEDULE TYPES ============
export interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface CreateScheduleRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface UpdateScheduleRequest {
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  isActive?: boolean;
}

// ============ SLOT TYPES ============
export type SlotStatus = 'Available' | 'Booked' | 'Blocked';

export interface Slot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

// ============ APPOINTMENT TYPES ============
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow';

export type CancelledBy = 'Patient' | 'Doctor' | 'Admin';

export interface Appointment {
  id: number;
  slotId: number;
  doctorProfileId: number;
  patientProfileId: number;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  doctorNotes?: string;
  bookedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  hasReview: boolean;
}

export interface BookAppointmentRequest {
  slotId: number;
  reasonForVisit?: string;
}

export interface CancelAppointmentRequest {
  cancellationReason?: string;
}

export interface AddDoctorNotesRequest {
  notes: string;
}

export interface AppointmentFilterRequest {
  status?: AppointmentStatus;
  pageNumber?: number;
  pageSize?: number;
}

// ============ REVIEW TYPES ============
export interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  isVisible: boolean;
  patientName: string;
}

export interface SubmitReviewRequest {
  appointmentId: number;
  rating: number;
  comment?: string;
}

export interface ReviewFilterRequest {
  pageNumber?: number;
  pageSize?: number;
}

// ============ NOTIFICATION TYPES ============
export type NotificationType =
  | 'AppointmentReminder'
  | 'AppointmentConfirmed'
  | 'AppointmentCancelled'
  | 'AppointmentCompleted'
  | 'SystemAlert';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: number;
}

// ============ SPECIALTY TYPES ============
export interface Specialty {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface CreateSpecialtyRequest {
  name: string;
  description?: string;
  iconUrl?: string;
}

// ============ ADMIN TYPES ============
export interface AdminOverviewStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalSpecialties: number;
  pendingApprovals: number;
  totalReviews: number;
}

export interface AdminAppointmentStats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

// ============ ERROR TYPES ============
export interface ApiError {
  type: string;
  title: string;
  detail?: string;
  status: number;
  errors?: Record<string, string[]>;
}
