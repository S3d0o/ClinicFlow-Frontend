import type { DeskAppointment } from '@/features/desk/model/desk';
import type { EncounterStatus } from '@/features/encounters/model/encounter';
import type { Allergy } from '@/features/profile/model/profile';
import type { Room } from '@/features/queue/model/queue';
import type { TriageForm } from '@/features/triage/model/vitals';

/** One of the doctor's visits today: the desk's view plus what the doctor needs before calling them in. */
export interface DoctorVisit extends DeskAppointment {
  queuePosition?: number;
  /** The nurse's vitals and complaint, once triaged. */
  triage?: { form: TriageForm; recordedAt: string; recordedByName: string };
  allergies: Allergy[];
  /** The visit's encounter, once there is one. */
  encounterStatus?: EncounterStatus;
  calledAt?: string;
}

/** A shift on the doctor's weekly schedule (FR-SCH-01) as it falls on a date. */
export interface ShiftDay {
  date: string;
  branchId: string;
  startTime: string;
  endTime: string;
  room?: Room;
  slotsTotal: number;
  slotsBooked: number;
  /** Approved leave covers the shift (FR-SCH-06). */
  onLeave: boolean;
}

export interface DoctorDay {
  date: string;
  visits: DoctorVisit[];
  /** Today's shifts at every branch the doctor works at. */
  shifts: ShiftDay[];
}

/** A draft encounter of a finished visit: signing is due within 24 h (FR-EMR-09). */
export interface UnsignedEncounter {
  appointmentId: string;
  patientName: string;
  serviceId: string;
  branchId: string;
  date: string;
  completedAt: string;
}

export type LeaveStatus = 'Requested' | 'Approved' | 'Rejected' | 'Cancelled';

/** A leave request (05 §4.5, FR-SCH-06). Dates and times are branch wall clock. */
export interface LeaveRequest {
  id: string;
  reference: string;
  fromDate: string;
  toDate: string;
  /** Part of a day: both set; all day: neither. */
  startTime?: string;
  endTime?: string;
  reason: string;
  status: LeaveStatus;
  /** Appointments it touches, counted when it was requested. */
  affectedAppointments: number;
  requestedAt: string;
  decidedAt?: string;
  decidedByName?: string;
}

export interface LeaveRequestInput {
  fromDate: string;
  toDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
}

/** What a leave would touch (FR-SCH-06: counted at request time), per branch. */
export interface LeaveImpact {
  affected: number;
  byBranch: { branchId: string; count: number }[];
  shifts: number;
}

export interface DoctorWeek {
  weekStart: string;
  days: { date: string; shifts: ShiftDay[] }[];
  /** Scheduled minutes in the week, leave excluded. */
  minutes: number;
}
