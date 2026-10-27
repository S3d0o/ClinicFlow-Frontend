import type { HistoryFilter, PatientHistory } from '../model/history';

/**
 * A patient's history across branches (`GET /api/v2/patients/{id}/history`, `encounters.view`;
 * FR-EMR-12). Only visits at branches in the user's scope are returned; break-glass is phase 5.
 * Errors: `Patient.NotFound`, `Access.OutOfScope`.
 */
export interface PatientHistoryService {
  get(patientId: string, filter: HistoryFilter): Promise<PatientHistory>;
  /** A printable summary of the history (PDF). */
  downloadSummary(patientId: string): Promise<Blob>;
}
