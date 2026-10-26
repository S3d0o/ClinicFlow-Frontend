import type { QueueEntry, WaitingDisplay } from '../model/queue';

/**
 * The branch queue (`/api/v2/branches/{id}/queue`, `queue.view`; actions `queue.manage`) and its live
 * updates (`/hubs/queue`). Errors: `Appointment.NotFound`, `Appointment.InvalidStatusTransition`,
 * `Appointment.DoctorBusy` (the doctor already has someone in the room).
 */
export interface QueueBoardService {
  /** Today's checked-in visits at the branch, in every stage. */
  board(branchId: string): Promise<QueueEntry[]>;
  /** The waiting-room screen: tickets and rooms, no names (FR-FD-06). */
  display(branchId: string): Promise<WaitingDisplay>;
  /** Ready for doctor → with the doctor; the appointment becomes `InProgress` (FR-FD-05). */
  call(appointmentId: string): Promise<QueueEntry>;
  /** Moves a waiting visit to the front of its line, with a reason that is audited (FR-FD-05). */
  moveToFront(appointmentId: string, reason: string): Promise<QueueEntry>;
  /** Calls `listener` whenever the branch's queue changes. Returns an unsubscribe function. */
  subscribe(branchId: string, listener: () => void): () => void;
}
