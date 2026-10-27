import { emptyDraft } from '@/features/encounters/model/encounter';
import type { MockDb } from './db';
import type { EncounterRecord } from './seed/clinical';
import type { AppointmentRecord } from './seed/patient-portal';

// What the doctor's adapters share: the doctor behind an account, and a visit's encounter.

/** The doctor profile of an account, if the account is a doctor. */
export const doctorForUser = (db: MockDb, userId: string) => db.doctors.find((d) => d.userId === userId);

/** The account behind a doctor profile. */
export const userOfDoctor = (db: MockDb, doctorId: string) => {
  const doctor = db.doctors.find((d) => d.id === doctorId);
  return doctor && db.users.find((u) => u.id === doctor.userId);
};

const HAS_ENCOUNTER = new Set(['CheckedIn', 'InProgress', 'Completed']);

/**
 * The visit's encounter. It exists from check-in (FR-EMR-01); for visits checked in before the
 * encounters existed in this demo, it is created on first read. `undefined` before check-in.
 */
export function encounterFor(db: MockDb, record: AppointmentRecord, now: Date): EncounterRecord | undefined {
  const existing = db.encounters.find((e) => e.appointmentId === record.id && e.status !== 'Voided');
  if (existing || !HAS_ENCOUNTER.has(record.status)) return existing;
  const created: EncounterRecord = {
    ...emptyDraft(),
    id: `enc-${crypto.randomUUID()}`,
    appointmentId: record.id,
    status: 'Draft',
    rowVersion: 1,
    savedAt: now.toISOString(),
    addenda: [],
  };
  db.encounters.push(created);
  return created;
}
