import type { Diagnosis, EncounterStatus, OrderType, PrescriptionItem } from '@/features/encounters/model/encounter';
import type { PatientDocument, PolicyStatus } from '@/features/documents/model/documents';
import type { Gender } from '@/features/patients/model/patient';
import type { Allergy } from '@/features/profile/model/profile';

/** One recorded set of vitals, for the trends (FR-EMR-12). */
export interface VitalsPoint {
  at: string;
  branchId: string;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  weightKg?: number;
  bmi?: number;
}

/** One visit in the patient's history across branches (FR-EMR-12). */
export interface HistoryEncounter {
  appointmentId: string;
  startsAtUtc: string;
  date: string;
  branchId: string;
  doctorName: string;
  /** The signed-in doctor saw this visit, so they can open its encounter. */
  byMe: boolean;
  specialtyId: string;
  status: EncounterStatus;
  /** The visit is today and still open. */
  inProgress: boolean;
  chiefComplaint?: string;
  assessment?: string;
  plan?: string;
  diagnoses: Diagnosis[];
  prescriptions: PrescriptionItem[];
  orders: { type: OrderType; description: string; status: string }[];
  addendaCount: number;
}

/** A medicine from a signed encounter, with whether its course is still running. */
export interface HistoryPrescription extends PrescriptionItem {
  startedOn: string;
  doctorName: string;
  active: boolean;
}

export interface PatientHistory {
  patient: {
    id: string;
    fullName: string;
    mrn: string;
    phone: string;
    gender?: Gender;
    dateOfBirth?: string;
    nationalId?: string;
    bloodType?: string;
    allergies: Allergy[];
    conditions: string[];
    insurance?: { payerName: string; memberNo: string; status: PolicyStatus };
  };
  vitals: VitalsPoint[];
  encounters: HistoryEncounter[];
  prescriptions: HistoryPrescription[];
  documents: PatientDocument[];
}

export type HistoryPeriod = '12m' | '24m' | 'all';

export interface HistoryFilter {
  branchId?: string;
  period: HistoryPeriod;
}

/** The earliest date a period keeps ("yyyy-MM-dd"), or undefined for all time. */
export function periodStart(period: HistoryPeriod, today: string): string | undefined {
  if (period === 'all') return undefined;
  const months = period === '12m' ? 12 : 24;
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 - months, d));
  return date.toISOString().slice(0, 10);
}

/** Change between the first and last reading, e.g. +8 mmHg; undefined with fewer than two readings. */
export function trend(points: VitalsPoint[], key: 'systolic' | 'diastolic' | 'pulse' | 'weightKg') {
  const values = points.map((p) => p[key]).filter((v): v is number => v !== undefined);
  if (values.length < 2) return undefined;
  return Math.round((values[values.length - 1] - values[0]) * 10) / 10;
}
