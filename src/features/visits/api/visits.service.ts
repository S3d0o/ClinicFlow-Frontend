import type { VisitListItem, VisitSummary } from '../model/visit';

/** The patient's published visit summaries (FR-PAT-05, FR-EMR-13). Errors: `Visit.NotFound`. */
export interface VisitsService {
  listMine(): Promise<VisitListItem[]>;
  getMine(visitId: string): Promise<VisitSummary>;
  /** The signed prescription as a PDF with its verification code (FR-EMR-05). */
  downloadPrescription(visitId: string): Promise<Blob>;
}
