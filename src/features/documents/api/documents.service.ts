import type { AddPolicyRequest, InsurancePolicy, Payer, PatientDocument } from '../model/documents';

/** Files the patient shares with their doctors (FR-PAT-06). Errors: `File.TypeNotAllowed`, `File.TooLarge`, `File.NotFound`. */
export interface DocumentsService {
  listMine(): Promise<PatientDocument[]>;
  upload(file: File): Promise<PatientDocument>;
  download(documentId: string): Promise<Blob>;
  remove(documentId: string): Promise<void>;
}

/** The patient's insurance cards (FR-INS-03); a new card waits for the desk to verify it. */
export interface InsuranceService {
  listMine(): Promise<InsurancePolicy[]>;
  listPayers(): Promise<Payer[]>;
  add(request: AddPolicyRequest): Promise<InsurancePolicy>;
}
