import type { DuplicateCandidate, PatientFilter, PatientSummary, RegisterPatientRequest } from '../model/patient';

/**
 * Patient records at the desk (`/api/v2/patients`, `patients.view` / `patients.register`).
 * Errors: `Patient.NotFound`, `Validation.InvalidPhone`.
 */
export interface PatientsService {
  /** Name, phone (partial), MRN, national ID or date of birth (FR-FD-01); at most 20 matches. */
  search(query: string, filter?: PatientFilter): Promise<PatientSummary[]>;
  get(patientId: string): Promise<PatientSummary>;
  /** Records that look like the same person: same phone, or same name and date of birth (FR-FD-02). */
  findDuplicates(candidate: DuplicateCandidate): Promise<PatientSummary[]>;
  /** Creates the record with the next MRN. A possible duplicate is a warning, never a refusal. */
  register(request: RegisterPatientRequest): Promise<PatientSummary>;
}
