import type { QueueEntry } from '@/features/queue/model/queue';
import type { TriageCase, TriageForm } from '../model/vitals';

/**
 * The nurse's triage (`POST /api/v2/encounters/{id}/vitals`, `vitals.write`; FR-EMR-02). Until the
 * encounter exists (backend P4) the mock keys everything by appointment.
 * Errors: `Appointment.NotFound`, `Appointment.InvalidStatusTransition`, `Vitals.OutOfRange`.
 */
export interface TriageService {
  get(appointmentId: string): Promise<TriageCase>;
  /** Keeps unfinished vitals so the nurse can come back to them. */
  saveDraft(appointmentId: string, form: TriageForm): Promise<{ savedAt: string }>;
  /** Records the vitals (recorded by and at) and moves the visit to "ready for doctor". */
  submit(appointmentId: string, form: TriageForm): Promise<QueueEntry>;
}
