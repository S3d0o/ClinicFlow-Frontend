import { leaveCovers } from '@/features/doctor/model/rules';
import type { Slot } from '@/features/doctors/model/doctor';
import type { MockDb } from './db';
import { generateSlots } from './slots';

const HOLDS_A_SLOT = new Set(['Confirmed', 'CheckedIn', 'InProgress']);

/** Slot ids held by bookings (`doctorId|branchId|date|startTime`, the generated slot id). */
export function bookedSlotIds(db: MockDb): Set<string> {
  return new Set(
    db.appointments
      .filter((a) => HOLDS_A_SLOT.has(a.status))
      .map((a) => a.slotId ?? `${a.doctorId}|${a.branchId}|${a.date}|${a.startTime}`)
  );
}

export const timeZoneOf = (db: MockDb, branchId: string) => db.branches.find((b) => b.id === branchId)?.timeZone ?? 'Africa/Cairo';

/** A doctor's slots at one branch from `from` for `days`, with booked ones and approved leave (FR-SCH-06) marked taken. */
export function slotsAt(db: MockDb, doctorId: string, branchId: string, from: string, days: number, now: Date): Slot[] {
  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) return [];
  const booked = bookedSlotIds(db);
  const leave = db.leaveRequests.filter((l) => l.doctorId === doctorId && l.status === 'Approved');
  return generateSlots(doctor, { branchId, from, days, timeZone: timeZoneOf(db, branchId), now }).map((slot) =>
    booked.has(slot.id) || leave.some((l) => leaveCovers(l, slot.date, slot.startTime, slot.endTime)) ? { ...slot, available: false } : slot
  );
}

/** The slot behind an id, as it stands now (taken, in the past or unknown → undefined or unavailable). */
export function findSlot(db: MockDb, slotId: string, now: Date): Slot | undefined {
  const [doctorId, branchId, date] = slotId.split('|');
  if (!doctorId || !branchId || !date) return undefined;
  return slotsAt(db, doctorId, branchId, date, 1, now).find((s) => s.id === slotId);
}
