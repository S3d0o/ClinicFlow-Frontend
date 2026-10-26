import type { Gender } from '@/features/patients/model/patient';
import type { Allergy } from '@/features/profile/model/profile';
import type { QueueEntry } from '@/features/queue/model/queue';

/** Vital signs taken at triage (FR-EMR-02). Every value is optional: the nurse records what was measured. */
export interface Vitals {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  /** °C */
  temperature?: number;
  respiratoryRate?: number;
  /** % */
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
  /** 0–10 (numeric rating scale) */
  painScore?: number;
}

/** What the nurse sends to the doctor (`POST /api/v2/encounters/{id}/vitals`). */
export interface TriageForm extends Vitals {
  chiefComplaint?: string;
  allergiesConfirmed: boolean;
}

/** A patient at the triage station: the queue entry, the safety facts and any saved draft. */
export interface TriageCase {
  entry: QueueEntry;
  patient: {
    mrn: string;
    fullName: string;
    gender?: Gender;
    dateOfBirth?: string;
    bloodType?: string;
    allergies: Allergy[];
    conditions: string[];
  };
  draft?: { form: TriageForm; savedAt: string };
}

export type VitalKey = keyof Vitals;

/**
 * Accepted input (anything outside is a typing mistake) and the normal range (outside it is flagged
 * for the doctor but still saved, FR-EMR-02). Adult reference ranges.
 */
export const VITAL_LIMITS: Record<VitalKey, { min: number; max: number; normal?: [number, number]; step: number }> = {
  systolic: { min: 50, max: 260, normal: [90, 139], step: 1 },
  diastolic: { min: 30, max: 160, normal: [60, 89], step: 1 },
  pulse: { min: 20, max: 250, normal: [60, 100], step: 1 },
  temperature: { min: 30, max: 45, normal: [36.1, 37.5], step: 0.1 },
  respiratoryRate: { min: 4, max: 60, normal: [12, 20], step: 1 },
  spo2: { min: 50, max: 100, normal: [95, 100], step: 1 },
  weightKg: { min: 0.5, max: 350, step: 0.1 },
  heightCm: { min: 30, max: 250, step: 1 },
  painScore: { min: 0, max: 10, step: 1 },
};

/** Body-mass index from weight and height, one decimal; undefined until both are in. */
export function bmi({ weightKg, heightCm }: Pick<Vitals, 'weightKg' | 'heightCm'>): number | undefined {
  if (!weightKg || !heightCm) return undefined;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10) / 10;
}

export type BmiBand = 'underweight' | 'normal' | 'overweight' | 'obese';

export function bmiBand(value: number): BmiBand {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
}

/** Whether a value can be saved at all (outside means it was mistyped). */
export const isPlausible = (key: VitalKey, value: number) => value >= VITAL_LIMITS[key].min && value <= VITAL_LIMITS[key].max;

/** High or low against the normal range, or undefined when normal or not measured. */
export function vitalFlag(key: VitalKey, value: number | undefined): 'high' | 'low' | undefined {
  const normal = VITAL_LIMITS[key].normal;
  if (value === undefined || !normal) return undefined;
  if (value < normal[0]) return 'low';
  if (value > normal[1]) return 'high';
  return undefined;
}

/** The values a nurse typed that can't be real, so the form asks to fix them before sending. */
export const implausibleKeys = (vitals: Vitals) =>
  (Object.keys(VITAL_LIMITS) as VitalKey[]).filter((key) => vitals[key] !== undefined && !isPlausible(key, vitals[key]!));

/** "142/92": blood pressure as written; undefined until both numbers are in. */
export const bloodPressure = (v: Pick<Vitals, 'systolic' | 'diastolic'>) =>
  v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : undefined;

/** What the nurse typed, as a value: "37.5" → 37.5; empty → undefined; anything else → NaN (one decimal at most). */
export const parseVital = (text: string) => (text.trim() === '' ? undefined : /^\d+(\.\d)?$/.test(text.trim()) ? Number(text.trim()) : Number.NaN);
