// The patient-facing visit summary (FR-EMR-13): plain diagnosis names, prescriptions, orders and
// instructions, published when the doctor signs the encounter. No internal notes. Clinical texts are
// stored as the doctor wrote them (Arabic or English, R9).

export interface Prescription {
  drug: string;
  /** e.g. "5 mg" */
  strength?: string;
  genericName?: string;
  /** e.g. "1 tablet every morning" */
  dosage: string;
  durationDays?: number;
  instructions?: string;
}

export type OrderStatus = 'Pending' | 'ResultReceived';

/** A lab, imaging or referral order (FR-EMR-07). */
export interface VisitOrder {
  name: string;
  detail?: string;
  status: OrderStatus;
  resultNote?: string;
}

/** The doctor's recommended follow-up (FR-APT-11): a window of branch-local dates. */
export interface FollowUp {
  from: string;
  to: string;
  serviceId?: string;
}

export interface VisitSummary {
  id: string;
  appointmentId: string;
  appointmentReference: string;
  startsAtUtc: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  branchId: string;
  diagnoses: string[];
  /** What the doctor found, in plain words for the patient. */
  findings?: string;
  prescriptions: Prescription[];
  /** The prescription's verification code (FR-EMR-05), when there is one. */
  prescriptionCode?: string;
  orders: VisitOrder[];
  instructions: string[];
  followUp?: FollowUp;
}

/** A row of "My visits". */
export type VisitListItem = Pick<
  VisitSummary,
  'id' | 'startsAtUtc' | 'doctorId' | 'doctorName' | 'specialtyId' | 'branchId' | 'diagnoses' | 'followUp'
> & { prescriptionCount: number; orderCount: number };
