import { CHANGE_WINDOW_HOURS } from '@/features/appointments/model/policy';
import { requirePermission, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { createAppointment, nextReference, priceOf } from '@/mocks/booking';
import { delay } from '@/mocks/db';
import {
  amounts,
  findPatient,
  nextTicket,
  patientIdentity,
  publishQueue,
  renumberQueue,
  todayAt,
  toDeskAppointment,
} from '@/mocks/front-desk';
import { notify } from '@/mocks/notifications';
import type { AppointmentRecord } from '@/mocks/seed/patient-portal';
import { slotsAt, timeZoneOf } from '@/mocks/slot-availability';
import { ServiceError } from '@/shared/api/service-error';
import { wallClockIn, wallClockToUtc } from '@/shared/lib/branch-time';
import { CHECK_IN_OPENS_MINUTES, NO_SHOW_GRACE_MINUTES, WALK_IN_CAP } from '../model/policy';
import type { DeskService } from './desk.service';

const MINUTE = 60_000;
const ACTIVE = new Set(['Confirmed', 'CheckedIn', 'InProgress']);
/** A walk-in takes a free slot that starts within this many minutes; otherwise it joins unslotted. */
const WALK_IN_SLOT_MINUTES = 30;

const plusMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export function createMockDeskService(deps: AuthMockDeps): DeskService {
  const { db, latencyMs, now, outboxDelayMs } = deps;

  const find = (appointmentId: string) => {
    const record = db.appointments.find((a) => a.id === appointmentId);
    if (!record) throw new ServiceError('Appointment.NotFound');
    return record;
  };

  const patientOf = (patientId: string) => {
    const patient = findPatient(db, patientId);
    if (!patient) throw new ServiceError('Patient.NotFound');
    return patient;
  };

  /** Gives a checked-in visit its ticket at the end of the triage line (FR-FD-03). */
  const joinQueue = (record: AppointmentRecord) => {
    const at = now().toISOString();
    record.status = 'CheckedIn';
    record.checkedInAt = at;
    record.queue = {
      ticketNo: nextTicket(db, record, now()),
      stage: 'WaitingTriage',
      position: Number.MAX_SAFE_INTEGER,
      estimatedWaitMinutes: 0,
      checkedInAt: at,
      updatedAt: at,
    };
    renumberQueue(db, record.branchId, now());
    publishQueue(db, record.branchId);
  };

  return {
    async listDay(branchId, date) {
      await delay(latencyMs);
      requirePermission(deps, 'appointments.view', branchId);
      return db.appointments
        .filter((a) => a.branchId === branchId && a.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((a) => toDeskAppointment(db, a));
    },

    async listUpcomingFor(patientId) {
      await delay(latencyMs);
      patientOf(patientId);
      return db.appointments
        .filter((a) => a.patientId === patientId && ACTIVE.has(a.status) && a.date >= todayAt(db, a.branchId, now()))
        .filter((a) => {
          try {
            requirePermission(deps, 'appointments.view', a.branchId);
            return true;
          } catch {
            return false;
          }
        })
        .sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc))
        .map((a) => toDeskAppointment(db, a));
    },

    async getCheckIn(appointmentId) {
      await delay(latencyMs);
      const record = find(appointmentId);
      requirePermission(deps, 'appointments.check_in', record.branchId);
      const patient = patientOf(record.patientId);
      const identity = patientIdentity(db, patient);
      const { subtotal, depositPaid, due } = amounts(db, record);
      const policy = patient.userId ? db.policies.find((p) => p.patientUserId === patient.userId && p.isDefault) : undefined;
      return structuredClone({
        appointment: toDeskAppointment(db, record),
        patient: {
          phone: identity.phone,
          phoneVerified: identity.phoneVerified,
          nationalId: patient.nationalId,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
        },
        charges: { price: subtotal, depositPaid, due },
        insurance: policy && {
          payerName: policy.payerName,
          planName: policy.planName,
          memberNo: policy.memberNo,
          coveragePercent: policy.coveragePercent,
          validTo: policy.validTo,
          status: policy.status,
        },
      });
    },

    async checkIn(appointmentId) {
      await delay(latencyMs);
      const record = find(appointmentId);
      requirePermission(deps, 'appointments.check_in', record.branchId);
      if (record.status !== 'Confirmed') throw new ServiceError('Appointment.InvalidStatusTransition');
      // Only on the visit day, from an hour before the slot to the end of the day (FR-FD-03)
      const opensAt = Date.parse(record.startsAtUtc) - CHECK_IN_OPENS_MINUTES * MINUTE;
      if (record.date !== todayAt(db, record.branchId, now()) || now().getTime() < opensAt) {
        throw new ServiceError('Appointment.CheckInWindowClosed');
      }
      joinQueue(record);
      return toDeskAppointment(db, record);
    },

    async markNoShow(appointmentId) {
      await delay(latencyMs);
      const record = find(appointmentId);
      requirePermission(deps, 'appointments.mark_no_show', record.branchId);
      if (record.status !== 'Confirmed') throw new ServiceError('Appointment.InvalidStatusTransition');
      if (now().getTime() < Date.parse(record.startsAtUtc) + NO_SHOW_GRACE_MINUTES * MINUTE) {
        throw new ServiceError('Appointment.NoShowTooEarly');
      }
      record.status = 'NoShow';
      record.noShowAt = now().toISOString();
      return toDeskAppointment(db, record);
    },

    async book({ patientId, doctorId, branchId, serviceId, slotId, source }) {
      await delay(latencyMs);
      requirePermission(deps, 'appointments.book_on_behalf', branchId);
      const patient = patientOf(patientId);
      const [slotDoctorId, slotBranchId] = slotId.split('|');
      if (slotDoctorId !== doctorId || slotBranchId !== branchId) throw new ServiceError('Appointment.SlotNotFound');
      const record = createAppointment(db, patient, serviceId, slotId, now());
      record.source = source;
      db.appointments.push(record);
      notify(db, outboxDelayMs, patient.userId, 'AppointmentConfirmed', { appointment: record }, now);
      return toDeskAppointment(db, record);
    },

    async walkIn({ patientId, doctorId, branchId, serviceId, complaint }) {
      await delay(latencyMs);
      requirePermission(deps, 'appointments.check_in', branchId);
      const patient = patientOf(patientId);
      const doctor = db.doctors.find((d) => d.id === doctorId);
      if (!doctor?.services.some((s) => s.serviceId === serviceId)) throw new ServiceError('Booking.ServiceNotOffered');

      const today = todayAt(db, branchId, now());
      const soon = now().getTime() + WALK_IN_SLOT_MINUTES * MINUTE;
      const freeSlot = slotsAt(db, doctorId, branchId, today, 1, now()).find((s) => s.available && Date.parse(s.startsAtUtc) <= soon);

      let record: AppointmentRecord;
      if (freeSlot) {
        record = createAppointment(db, patient, serviceId, freeSlot.id, now());
      } else {
        const unslotted = db.appointments.filter(
          (a) => a.doctorId === doctorId && a.branchId === branchId && a.date === today && a.slotId?.startsWith('walk-in|') && a.status !== 'Cancelled'
        );
        if (unslotted.length >= WALK_IN_CAP) throw new ServiceError('Appointment.WalkInCapReached');
        const timeZone = timeZoneOf(db, branchId);
        const startTime = wallClockIn(timeZone, now());
        const id = `apt-${crypto.randomUUID()}`;
        const startsAt = wallClockToUtc(today, startTime, timeZone);
        record = {
          id,
          patientId: patient.id,
          patientUserId: patient.userId,
          slotId: `walk-in|${id}`,
          reference: nextReference(db, now()),
          status: 'Confirmed',
          source: 'WalkIn',
          doctorId,
          doctorName: db.users.find((u) => u.id === doctor.userId)!.fullName,
          specialtyId: doctor.specialtyId,
          branchId,
          serviceId,
          date: today,
          startTime,
          endTime: plusMinutes(startTime, doctor.slotMinutes),
          startsAtUtc: startsAt.toISOString(),
          price: priceOf(db, serviceId, branchId, doctorId, today),
          depositPaid: false,
          bookedAt: now().toISOString(),
          changeableUntil: new Date(startsAt.getTime() - CHANGE_WINDOW_HOURS * 3_600_000).toISOString(),
          attendanceConfirmed: true,
          hasReview: false,
        };
      }
      record.source = 'WalkIn';
      record.complaint = complaint?.trim() || undefined;
      // A walk-in has no deposit to offer: the patient is already here
      record.depositAmount = undefined;
      db.appointments.push(record);
      joinQueue(record);
      return toDeskAppointment(db, record);
    },
  };
}
