import { CHANGE_WINDOW_HOURS } from '@/features/appointments/model/policy';
import { resolvePrice } from '@/features/catalog/model/pricing';
import { ServiceError } from '@/shared/api/service-error';
import { wallClockToUtc } from '@/shared/lib/branch-time';
import type { MockDb } from './db';
import type { AppointmentRecord, PatientRecordSeed } from './seed/patient-portal';
import { findSlot, timeZoneOf } from './slot-availability';

// Booking rules shared by the patient's own booking and the desk booking on their behalf.

export const nextReference = (db: MockDb, now: Date) =>
  `CF-${String(now.getUTCFullYear()).slice(2)}-${String(9300 + db.appointments.length).padStart(5, '0')}`;

/** Whether a slot id (`doctorId|branchId|date|HH:mm`) names a time that has already started at its branch. */
const hasStarted = (db: MockDb, slotId: string, now: Date) => {
  const [, branchId, date, time] = slotId.split('|');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !/^\d{2}:\d{2}$/.test(time ?? '')) return false;
  return wallClockToUtc(date, time, timeZoneOf(db, branchId)).getTime() <= now.getTime();
};

/** The price of a service with a doctor at a branch on a date (FR-SVC-02). */
export const priceOf = (db: MockDb, serviceId: string, branchId: string, doctorId: string, date: string) =>
  resolvePrice(db.priceList, { serviceId, branchId, doctorId, date }) ?? 0;

/** A new `Confirmed` appointment in `slotId`, priced from the price list on the visit date. */
export function createAppointment(db: MockDb, patient: PatientRecordSeed, serviceId: string, slotId: string, now: Date): AppointmentRecord {
  const slot = findSlot(db, slotId, now);
  if (!slot) throw new ServiceError(hasStarted(db, slotId, now) ? 'Appointment.SlotInPast' : 'Appointment.SlotNotFound');
  if (!slot.available) throw new ServiceError('Slot.CapacityReached');
  const doctor = db.doctors.find((d) => d.id === slot.doctorId)!;
  if (!doctor.services.some((s) => s.serviceId === serviceId)) throw new ServiceError('Booking.ServiceNotOffered');
  const service = db.services.find((s) => s.id === serviceId)!;
  const startsAt = Date.parse(slot.startsAtUtc);

  return {
    id: `apt-${crypto.randomUUID()}`,
    patientId: patient.id,
    patientUserId: patient.userId,
    slotId,
    reference: nextReference(db, now),
    status: 'Confirmed', // deposit or not (FR-APT-02)
    source: 'Online',
    doctorId: doctor.id,
    doctorName: db.users.find((u) => u.id === doctor.userId)!.fullName,
    specialtyId: doctor.specialtyId,
    branchId: slot.branchId,
    serviceId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    startsAtUtc: slot.startsAtUtc,
    price: priceOf(db, serviceId, slot.branchId, doctor.id, slot.date),
    depositAmount: service.optionalDepositAmount || undefined,
    depositPaid: false,
    bookedAt: now.toISOString(),
    changeableUntil: new Date(startsAt - CHANGE_WINDOW_HOURS * 3_600_000).toISOString(),
    attendanceConfirmed: false,
    hasReview: false,
  };
}
