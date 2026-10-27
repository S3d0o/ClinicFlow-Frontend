import type { DoctorDay, DoctorWeek, LeaveImpact, LeaveRequest, LeaveRequestInput, UnsignedEncounter } from '../model/doctor-day';

/**
 * The signed-in doctor's own work (`encounters.write`, own; 07 §4). Their doctor profile comes from the
 * token, so no doctor id is sent. Errors: `Doctor.ProfileNotFound` (the user isn't a doctor).
 */
export interface DoctorDayService {
  /** Today's visits and shifts at every branch the doctor works at (`date` is the branch date). */
  myDay(date: string): Promise<DoctorDay>;
  /** Draft encounters of finished visits, oldest first (FR-EMR-09). */
  unsigned(): Promise<UnsignedEncounter[]>;
}

/**
 * The doctor's schedule and leave (FR-SCH-01, FR-SCH-06; `leave.request`, own).
 * Errors: `Doctor.ProfileNotFound`, `Leave.InPast`, `Leave.InvalidRange`, `Leave.ReasonRequired`, `Leave.Overlaps`,
 * `Leave.NotFound`, `Leave.InvalidStatusTransition`.
 */
export interface ScheduleService {
  /** The week starting `weekStart` (a Saturday): shifts with booked slots, leave marked. */
  myWeek(weekStart: string): Promise<DoctorWeek>;
  listMyLeave(): Promise<LeaveRequest[]>;
  /** How many booked appointments a leave would touch, before asking for it (FR-SCH-06). */
  previewLeave(input: Omit<LeaveRequestInput, 'reason'>): Promise<LeaveImpact>;
  /** Asks a manager to approve (phase 5 approvals); slots stay bookable until then. */
  requestLeave(input: LeaveRequestInput): Promise<LeaveRequest>;
  /** Before it starts, while requested or approved. */
  cancelLeave(leaveId: string): Promise<LeaveRequest>;
}
