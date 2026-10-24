import type { Slot } from '@/features/doctors/model/doctor';
import { addDays, todayIn, wallClockIn, wallClockToUtc, weekdayOf } from '@/shared/lib/branch-time';
import type { DoctorSeed } from './seed/doctors';

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Some slots are already taken, so the demo looks like a working clinic. Deterministic, so the same
 * slot is taken on every screen and every reload. Phase 2 replaces this with real bookings.
 */
const isTaken = (key: string) => [...key].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381) % 4 === 0;

interface SlotOptions {
  branchId?: string;
  from: string;
  days: number;
  timeZone: string;
  now: Date;
}

/**
 * The doctor's slots from their weekly shifts (V1's slot generation, per branch in V2). Slots that
 * have already started at the branch are left out.
 */
export function generateSlots(doctor: DoctorSeed, { branchId, from, days, timeZone, now }: SlotOptions): Slot[] {
  const today = todayIn(timeZone, now);
  const nowMinutes = toMinutes(wallClockIn(timeZone, now));
  const slots: Slot[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    if (date < today) continue;
    const shifts = doctor.schedule
      .filter((s) => s.weekday === weekdayOf(date) && (!branchId || s.branchId === branchId))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const shift of shifts) {
      for (let start = toMinutes(shift.startTime); start + doctor.slotMinutes <= toMinutes(shift.endTime); start += doctor.slotMinutes) {
        if (date === today && start <= nowMinutes) continue;
        const startTime = toTime(start);
        const id = `${doctor.id}|${shift.branchId}|${date}|${startTime}`;
        slots.push({
          id,
          doctorId: doctor.id,
          branchId: shift.branchId,
          date,
          startTime,
          endTime: toTime(start + doctor.slotMinutes),
          startsAtUtc: wallClockToUtc(date, startTime, timeZone).toISOString(),
          available: !isTaken(id),
        });
      }
    }
  }
  return slots;
}
