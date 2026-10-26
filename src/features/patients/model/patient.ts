import type { PolicyStatus } from '@/features/documents/model/documents';
import { daysBetween } from '@/shared/lib/branch-time';

export type Gender = 'Male' | 'Female';

/** How the patient's insurance card stands, as the desk sees it (FR-INS-03). */
export type InsuranceCardStatus = PolicyStatus;

/**
 * A patient as the front desk finds them (`GET /api/v2/patients?q=`): the clinic's record (MRN) and
 * the person. A patient registered at the desk may have no portal account yet (05 §3.3).
 */
export interface PatientSummary {
  id: string;
  /** Sequential per organization (FR-FD-02), e.g. "MRN-000412". */
  mrn: string;
  fullName: string;
  /** E.164, e.g. "+201012345678". */
  phone: string;
  gender?: Gender;
  /** "yyyy-MM-dd" */
  dateOfBirth?: string;
  nationalId?: string;
  hasPortalAccount: boolean;
  registeredAt: string;
  lastVisit?: { date: string; doctorName: string };
  /** What the patient owes across issued invoices (FR-BIL-12). */
  balanceDue: number;
  insurance?: { payerName: string; status: InsuranceCardStatus };
}

export interface RegisterPatientRequest {
  fullName: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

/** Who a duplicate check compares (FR-FD-02): the phone, or the name with the date of birth. */
export type DuplicateCandidate = Partial<Pick<RegisterPatientRequest, 'fullName' | 'phone' | 'dateOfBirth'>>;

export type PatientFilter = 'all' | 'balance' | 'insured';

/** Whole years from `dateOfBirth` to `today` (both "yyyy-MM-dd"). */
export function ageOn(dateOfBirth: string, today: string): number {
  const years = Number(today.slice(0, 4)) - Number(dateOfBirth.slice(0, 4));
  return today.slice(5) < dateOfBirth.slice(5) ? years - 1 : years;
}

/** A young child's age reads better in months ("8 months") than in years ("0"). */
export function ageParts(dateOfBirth: string, today: string): { unit: 'years' | 'months'; value: number } {
  const years = ageOn(dateOfBirth, today);
  if (years >= 2) return { unit: 'years', value: years };
  return { unit: 'months', value: Math.max(0, Math.floor(daysBetween(dateOfBirth, today) / 30.44)) };
}

export const matchesFilter = (patient: PatientSummary, filter: PatientFilter) =>
  filter === 'all' || (filter === 'balance' ? patient.balanceDue > 0 : !!patient.insurance);
