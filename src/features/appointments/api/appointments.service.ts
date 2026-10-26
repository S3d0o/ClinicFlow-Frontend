import type { Appointment, BookRequest, CancelRequest, QueueStatus } from '../model/appointment';

/**
 * The signed-in patient's appointments (`/api/v2/appointments`, patient-owned). Errors:
 * `Appointment.NotFound`, `Slot.CapacityReached` (taken meanwhile), `Appointment.SlotInPast`, `Appointment.SlotNotFound`,
 * `Booking.ServiceNotOffered`, `Deposit.NotOffered`, `Deposit.AlreadyPaid`,
 * `Appointment.CancellationWindowExpired` (cancel or reschedule too late), `Consent.Required`,
 * `Auth.PhoneNotVerified`, `Appointment.InvalidStatusTransition`, `Appointment.ReviewAlreadyExists`,
 * `Appointment.ReviewNotAllowed`, `Payment.GatewayUnavailable`.
 */
export interface PatientAppointmentsService {
  listMine(): Promise<Appointment[]>;
  getMine(appointmentId: string): Promise<Appointment>;
  /** Always `Confirmed`, deposit or not (FR-APT-02, FR-APT-08). The HTTP adapter sends an `Idempotency-Key`. */
  book(request: BookRequest): Promise<Appointment>;
  /** Books the new slot and marks this appointment `Rescheduled`; returns the new appointment (FR-APT-05). */
  reschedule(appointmentId: string, slotId: string): Promise<Appointment>;
  cancel(appointmentId: string, request: CancelRequest): Promise<Appointment>;
  /** Paymob hosted checkout for the optional deposit; the app sends the patient to `checkoutUrl`. */
  startDepositCheckout(appointmentId: string): Promise<{ checkoutUrl: string }>;
  /** A 1–5 rating and an optional comment after a completed visit (V1 #25). */
  submitReview(appointmentId: string, review: { rating: number; comment?: string }): Promise<void>;
}

/**
 * Live queue updates for the patient's visit today (`/hubs/queue`, U3). The listener gets the
 * current status at once, then every change. Returns an unsubscribe function.
 */
export interface QueueStatusService {
  watch(appointmentId: string, listener: (status: QueueStatus) => void): () => void;
}

/** What the reminder link (WhatsApp or SMS) shows, without signing in (FR-APT-09, FR-APT-10). */
export interface ReminderView {
  appointmentId: string;
  reference: string;
  status: Appointment['status'];
  attendanceConfirmed: boolean;
  doctorName: string;
  specialtyId: string;
  branchId: string;
  serviceId: string;
  date: string;
  startTime: string;
  startsAtUtc: string;
  changeableUntil: string;
  price: number;
}

/** The one-tap reminder page (`/r/:token`). Errors: `Reminder.LinkInvalid`, `Appointment.CancellationWindowExpired`. */
export interface ReminderService {
  get(token: string): Promise<ReminderView>;
  confirm(token: string): Promise<ReminderView>;
  cancel(token: string): Promise<ReminderView>;
}
