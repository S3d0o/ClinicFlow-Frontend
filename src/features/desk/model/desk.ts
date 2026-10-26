import type { AppointmentStatus, BookingSource, QueueStage } from '@/features/appointments/model/appointment';
import type { Gender, InsuranceCardStatus } from '@/features/patients/model/patient';
import type { Room } from '@/features/queue/model/queue';

/** A visit on the front desk's day list (`GET /api/v2/branches/{id}/calendar`, FR-FD-03/04). */
export interface DeskAppointment {
  id: string;
  reference: string;
  status: AppointmentStatus;
  source: BookingSource;
  patient: { id: string; fullName: string; mrn: string; phone: string; dateOfBirth?: string };
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  serviceId: string;
  branchId: string;
  /** Branch-local "yyyy-MM-dd" and "HH:mm" (ADR 0003). */
  date: string;
  startTime: string;
  endTime: string;
  startsAtUtc: string;
  price: number;
  depositAmount?: number;
  depositPaid: boolean;
  /** The patient answered the reminder with "I'm coming" (FR-APT-10, U2). */
  attendanceConfirmed: boolean;
  checkedInAt?: string;
  completedAt?: string;
  queue?: { ticketNo: string; stage: QueueStage };
  /** The doctor's room at the branch (FR-ORG-04). */
  room?: Room;
  /** What's left to pay for this visit: services − paid deposit − payments (FR-BIL-14). */
  amountDue: number;
  /** An invoice was issued for the visit (the first payment issues it). */
  invoiced: boolean;
}

/** What the check-in panel shows (FR-FD-03): identity, money and insurance. */
export interface CheckInView {
  appointment: DeskAppointment;
  patient: {
    phone: string;
    /** The phone was verified by a one-time code (portal accounts only). */
    phoneVerified: boolean;
    nationalId?: string;
    gender?: Gender;
    dateOfBirth?: string;
  };
  /** `GET /api/v2/appointments/{id}/amount-due`: price, paid deposit and the remainder. */
  charges: { price: number; depositPaid: number; due: number };
  insurance?: {
    payerName: string;
    planName?: string;
    memberNo: string;
    coveragePercent?: number;
    validTo: string;
    status: InsuranceCardStatus;
  };
}

/** Booking on behalf of a patient (FR-APT-03): over the phone or at the desk. */
export interface DeskBookRequest {
  patientId: string;
  doctorId: string;
  branchId: string;
  serviceId: string;
  slotId: string;
  source: Extract<BookingSource, 'Phone' | 'Desk'>;
}

/** A walk-in: a free slot now, or an unslotted queue appointment; starts `CheckedIn` (FR-APT-04). */
export interface WalkInRequest {
  patientId: string;
  doctorId: string;
  branchId: string;
  serviceId: string;
  /** What brings the patient in, for the nurse. */
  complaint?: string;
}
