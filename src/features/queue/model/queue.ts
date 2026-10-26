import type { BookingSource, QueueStage } from '@/features/appointments/model/appointment';
import type { Gender } from '@/features/patients/model/patient';
import type { Allergy } from '@/features/profile/model/profile';
import type { Bilingual } from '@/shared/i18n/bilingual';
import type { Tone } from '@/shared/ui/StatusChip';

/** A room at a branch (FR-ORG-04); names in both languages (R9). */
export interface Room extends Bilingual {
  id: string;
}

/** One checked-in visit on the branch queue (`GET /api/v2/branches/{id}/queue`, `QueueEntry` 05 §3.3). */
export interface QueueEntry {
  appointmentId: string;
  ticketNo: string;
  stage: QueueStage;
  /** Place in line: across the branch while waiting for triage, per doctor once ready. */
  position: number;
  patientId: string;
  patientName: string;
  gender?: Gender;
  dateOfBirth?: string;
  mrn: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  serviceId: string;
  room?: Room;
  source: BookingSource;
  /** The booked start ("HH:mm"); none for an unslotted walk-in. */
  startTime?: string;
  checkedInAt: string;
  triagedAt?: string;
  calledAt?: string;
  completedAt?: string;
  /** Arrived this many minutes after the booked start (late arrivals are flagged, FR-FD-04). */
  lateMinutes: number;
  /** Moved to the front of the line, with the reason (FR-FD-05). */
  priorityReason?: string;
  /** From triage, for the doctor's column. */
  vitals?: { systolic?: number; diastolic?: number; pulse?: number };
  allergies: Allergy[];
  /** What the patient came for, typed at the desk or by the nurse. */
  complaint?: string;
  /** Left to pay for the visit. */
  amountDue: number;
}

/** A room's line on the waiting-room screen: tickets only, no patient names (FR-FD-06). */
export interface DisplayRoom {
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  room?: Room;
  nowServing?: string;
  next: string[];
  waitingCount: number;
  averageWaitMinutes: number;
}

export interface WaitingDisplay {
  branchId: string;
  rooms: DisplayRoom[];
  updatedAt: string;
}

/** The board's columns, in the order a visit moves through them (FR-FD-04). */
export const STAGES: QueueStage[] = ['WaitingTriage', 'ReadyForDoctor', 'WithDoctor', 'Done'];

/** Each column in line order: by position while waiting, newest first once done. */
export function boardColumns(entries: QueueEntry[]) {
  return STAGES.map((stage) => {
    const items = entries.filter((e) => e.stage === stage);
    items.sort((a, b) =>
      stage === 'Done'
        ? (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
        : stage === 'WithDoctor'
          ? (a.calledAt ?? '').localeCompare(b.calledAt ?? '')
          : a.position - b.position || a.checkedInAt.localeCompare(b.checkedInAt)
    );
    return { stage, entries: items };
  });
}

const minutesSince = (iso: string | undefined, now: Date) => (iso ? Math.max(0, Math.floor((now.getTime() - Date.parse(iso)) / 60_000)) : 0);

/** Minutes in the current stage: waiting since check-in or triage, in the room since called. */
export function minutesInStage(entry: QueueEntry, now: Date): number {
  if (entry.stage === 'WithDoctor') return minutesSince(entry.calledAt, now);
  if (entry.stage === 'ReadyForDoctor') return minutesSince(entry.triagedAt ?? entry.checkedInAt, now);
  return minutesSince(entry.checkedInAt, now);
}

/** Waits longer than this are highlighted on the board. */
export const LONG_WAIT_MINUTES = 30;

export const filterByDoctor = (entries: QueueEntry[], doctorId: string | null) =>
  doctorId ? entries.filter((e) => e.doctorId === doctorId) : entries;

/** The doctors on the queue today, for the filter. */
export function queueDoctors(entries: QueueEntry[]) {
  const doctors = new Map<string, { id: string; name: string; specialtyId: string }>();
  for (const e of entries) if (!doctors.has(e.doctorId)) doctors.set(e.doctorId, { id: e.doctorId, name: e.doctorName, specialtyId: e.specialtyId });
  return [...doctors.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** One stage → chip tone map for the board, the desk and the nurse station. */
export const STAGE_TONE: Record<QueueStage, Tone> = {
  WaitingTriage: 'warning',
  ReadyForDoctor: 'primary',
  WithDoctor: 'info',
  Done: 'neutral',
};
