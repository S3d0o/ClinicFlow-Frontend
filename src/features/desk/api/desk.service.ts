import type { CheckInView, DeskAppointment, DeskBookRequest, WalkInRequest } from '../model/desk';

/**
 * The front desk's day at a branch (`/api/v2/branches/{id}/calendar`, `/api/v2/appointments/...`).
 * Errors: `Appointment.NotFound`, `Patient.NotFound`, `Appointment.InvalidStatusTransition`,
 * `Appointment.CheckInWindowClosed`, `Appointment.NoShowTooEarly`, `Appointment.WalkInCapReached`,
 * `Slot.CapacityReached`, `Appointment.SlotInPast`, `Appointment.SlotNotFound`, `Booking.ServiceNotOffered`, `Access.OutOfScope`.
 */
export interface DeskService {
  /** Every visit at the branch on `date` (branch-local "yyyy-MM-dd"), whatever its status. */
  listDay(branchId: string, date: string): Promise<DeskAppointment[]>;
  /** A patient's visits from today on, to check them in from a search. */
  listUpcomingFor(patientId: string): Promise<DeskAppointment[]>;
  getCheckIn(appointmentId: string): Promise<CheckInView>;
  /** Confirmed → CheckedIn with a queue ticket (FR-FD-03). The HTTP adapter posts `/check-in`. */
  checkIn(appointmentId: string): Promise<DeskAppointment>;
  /** Confirmed → NoShow, once the grace period has passed (FR-APT-07). */
  markNoShow(appointmentId: string): Promise<DeskAppointment>;
  /** Books on the patient's behalf; always `Confirmed` (FR-APT-03). Sends an `Idempotency-Key`. */
  book(request: DeskBookRequest): Promise<DeskAppointment>;
  /** Books into a free slot now or an unslotted queue place, checked in at once (FR-APT-04). Sends an `Idempotency-Key` (§13.16). */
  walkIn(request: WalkInRequest): Promise<DeskAppointment>;
}
