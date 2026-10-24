/** Appointment statuses (05 §4.1). `Pending` stays in the API enum for V1 data but V2 never sets it. */
export type AppointmentStatus = 'Confirmed' | 'CheckedIn' | 'InProgress' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'NoShow';

export type BookingSource = 'Online' | 'Phone' | 'Desk' | 'WalkIn';

export type CancellationReasonCode = 'ScheduleConflict' | 'FeelingBetter' | 'BookedElsewhere' | 'CostOrInsurance' | 'Other';

/** Where a checked-in patient is in the branch queue (`QueueEntry.Stage`, 05 §3.3). */
export type QueueStage = 'WaitingTriage' | 'ReadyForDoctor' | 'WithDoctor' | 'Done';

/** The patient's live place in the queue on the visit day (UX_NOTES U3). */
export interface QueueStatus {
  /** Ticket number shown on the waiting-room screen, e.g. "A-14". */
  ticketNo: string;
  stage: QueueStage;
  /** 1 when the patient is next. */
  position: number;
  estimatedWaitMinutes: number;
  roomName?: string;
  /** Set when the doctor is running late. */
  doctorDelayMinutes?: number;
  checkedInAt?: string;
  triagedAt?: string;
  updatedAt: string;
}

/** A patient's own appointment (`GET /api/v2/appointments/{id}` for the patient). */
export interface Appointment {
  id: string;
  /** Booking reference given to the patient, e.g. "CF-26-08731". */
  reference: string;
  status: AppointmentStatus;
  source: BookingSource;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  branchId: string;
  serviceId: string;
  /** Branch-local "yyyy-MM-dd" and "HH:mm" (ADR 0003). */
  date: string;
  startTime: string;
  endTime: string;
  startsAtUtc: string;
  price: number;
  /** The optional deposit the service allows, if any (FR-APT-08). */
  depositAmount?: number;
  depositPaid: boolean;
  bookedAt: string;
  /** Until when the patient may cancel or reschedule online (the change window, FR-ORG-05). */
  changeableUntil: string;
  cancelledAt?: string;
  cancelledBy?: 'Patient' | 'Clinic';
  cancellationReason?: CancellationReasonCode;
  rescheduledToId?: string;
  rescheduledFromId?: string;
  /** The patient answered the reminder with "I'm coming" (FR-APT-10). */
  attendanceConfirmed: boolean;
  checkedInAt?: string;
  completedAt?: string;
  /** The published visit summary, once the doctor signs the encounter (FR-EMR-13). */
  visitId?: string;
  hasReview: boolean;
  queue?: QueueStatus;
}

export interface BookRequest {
  doctorId: string;
  branchId: string;
  serviceId: string;
  slotId: string;
  /** Terms and data-processing consent for this booking (FR-PAT-08). */
  acceptTerms: boolean;
}

export interface CancelRequest {
  reason: CancellationReasonCode;
  note?: string;
}
