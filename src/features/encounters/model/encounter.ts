import type { QueueStage } from '@/features/appointments/model/appointment';
import type { Gender } from '@/features/patients/model/patient';
import type { Allergy } from '@/features/profile/model/profile';
import type { Room } from '@/features/queue/model/queue';
import type { TriageForm } from '@/features/triage/model/vitals';
import type { Bilingual } from '@/shared/i18n/bilingual';

// The doctor's encounter (FR-EMR-01…10, 05 §3.4, §4.2), keyed by the visit's appointment like triage,
// so the doctor's screens never need an encounter id.

export type EncounterStatus = 'Draft' | 'Signed' | 'Voided';
export type DiagnosisStatus = 'Provisional' | 'Confirmed' | 'RuledOut';
export type OrderType = 'Lab' | 'Radiology' | 'Referral';

/** A code of the seeded ICD-10 table (FR-EMR-04): global reference data. */
export interface Icd10Code {
  code: string;
  titleEn: string;
  titleAr?: string;
}

export interface Diagnosis {
  id: string;
  code: string;
  title: string;
  isPrimary: boolean;
  status: DiagnosisStatus;
}

/** One medicine (FR-EMR-05). Immutable once the encounter is signed. */
export interface PrescriptionItem {
  id: string;
  drugName: string;
  /** From the drug catalog when picked from it; free text otherwise. */
  drugId?: string;
  strength?: string;
  form?: string;
  /** e.g. "1 tablet" */
  dose: string;
  /** e.g. "every morning" */
  frequency: string;
  durationDays?: number;
  instructions?: string;
  /** Set when the doctor prescribes despite a recorded allergy; the acknowledgement is kept (FR-EMR-05). */
  allergyOverrideReason?: string;
}

/** A lab, imaging or referral order (FR-EMR-07). */
export interface ClinicalOrder {
  id: string;
  type: OrderType;
  description: string;
  status: 'Ordered' | 'ResultReceived' | 'Cancelled';
}

export interface Addendum {
  id: string;
  text: string;
  authorName: string;
  signedAt: string;
}

export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/** What the doctor edits; saved whole, so autosave is one call (`rowVersion` guards it). */
export interface EncounterDraft {
  notes: SoapNotes;
  diagnoses: Diagnosis[];
  prescriptions: PrescriptionItem[];
  orders: ClinicalOrder[];
  /** Shown to the patient in the visit summary (FR-EMR-13); the SOAP notes never are. */
  patientInstructions: string;
  followUpInDays?: number;
}

export interface Encounter extends EncounterDraft {
  id: string;
  appointmentId: string;
  status: EncounterStatus;
  patient: {
    id: string;
    fullName: string;
    mrn: string;
    gender?: Gender;
    dateOfBirth?: string;
    bloodType?: string;
    allergies: Allergy[];
    conditions: string[];
  };
  visit: {
    reference: string;
    doctorId: string;
    doctorName: string;
    specialtyId: string;
    branchId: string;
    serviceId: string;
    startsAtUtc: string;
    status: 'Confirmed' | 'CheckedIn' | 'InProgress' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'NoShow';
    ticketNo?: string;
    stage?: QueueStage;
    checkedInAt?: string;
    calledAt?: string;
    room?: Room;
  };
  /** The nurse's vitals and complaint, read-only here (U8: carried forward, never retyped). */
  triage?: { form: TriageForm; recordedAt: string; recordedByName: string };
  addenda: Addendum[];
  signedAt?: string;
  signedByName?: string;
  /** Concurrency token: a save with an older one is refused (`Concurrency.Conflict`). */
  rowVersion: number;
  savedAt?: string;
}

/** A specialty template (FR-EMR-03) that fills empty SOAP sections. */
export interface EncounterTemplate extends Bilingual {
  id: string;
  specialtyId: string;
  notes: Partial<SoapNotes>;
}

/** A drug from the catalog, with the allergy classes it belongs to. */
export interface Drug {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  /** e.g. ["Penicillin"]: a patient allergic to one of these gets a conflict warning. */
  classes: string[];
}

export const emptyDraft = (): EncounterDraft => ({
  notes: { subjective: '', objective: '', assessment: '', plan: '' },
  diagnoses: [],
  prescriptions: [],
  orders: [],
  patientInstructions: '',
});

/** The part of an encounter the doctor edits, to compare with what was last saved. */
export const draftOf = ({ notes, diagnoses, prescriptions, orders, patientInstructions, followUpInDays }: EncounterDraft): EncounterDraft => ({
  notes, diagnoses, prescriptions, orders, patientInstructions, followUpInDays,
});
