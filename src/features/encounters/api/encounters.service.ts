import type { Drug, Encounter, EncounterDraft, EncounterTemplate, Icd10Code } from '../model/encounter';

/**
 * The doctor's encounter for a visit (FR-EMR-01…10; 07 §4 "Patients and clinical"), keyed by
 * appointment like triage (API contract §13.13). The visit's own doctor writes it (`encounters.write`,
 * own); signing needs `encounters.sign`.
 * Errors: `Appointment.NotFound`, `Access.OutOfScope` (not the visit's doctor), `Encounter.AlreadySigned`,
 * `Concurrency.Conflict` (saved meanwhile, e.g. in another tab), `Encounter.DiagnosisRequired`,
 * `Prescription.AllergyConflict` (a conflict not acknowledged), `Appointment.InvalidStatusTransition`.
 */
export interface EncountersService {
  /** The visit's encounter; a draft exists from check-in (FR-EMR-01). */
  get(appointmentId: string): Promise<Encounter>;
  /** Saves the whole draft (autosave, FR-EMR-03). `rowVersion` must be the one last read. */
  saveDraft(appointmentId: string, draft: EncounterDraft, rowVersion: number): Promise<Encounter>;
  /** Signs (locks) the encounter and completes the visit if it's in progress; publishes the patient's summary (FR-EMR-09, FR-EMR-13). */
  sign(appointmentId: string, rowVersion: number): Promise<Encounter>;
  /** Completes the visit and leaves the encounter to sign within 24 h (05 §4.1). */
  completeVisit(appointmentId: string): Promise<Encounter>;
  /** A signed note's correction, under the original (FR-EMR-10). */
  addAddendum(appointmentId: string, text: string): Promise<Encounter>;
  /** ICD-10 by code or words (FR-EMR-04); at most 20. */
  searchIcd10(query: string): Promise<Icd10Code[]>;
  /** The drug catalog by name or generic name; at most 10. */
  searchDrugs(query: string): Promise<Drug[]>;
  /** The whole catalog, for the allergy check (small reference data). */
  listDrugs(): Promise<Drug[]>;
  listTemplates(specialtyId: string): Promise<EncounterTemplate[]>;
}
