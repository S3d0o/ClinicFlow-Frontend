import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { doctorForUser } from '@/mocks/clinical';
import { delay, type MockDb } from '@/mocks/db';
import { findPatient, roomOf, todayAt, toDeskAppointment } from '@/mocks/front-desk';
import type { LeaveRecord } from '@/mocks/seed/clinical';
import type { DoctorSeed } from '@/mocks/seed/doctors';
import type { AppointmentRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { addDays, weekdayOf } from '@/shared/lib/branch-time';
import type { DoctorVisit, LeaveImpact, LeaveRequest, LeaveRequestInput, ShiftDay } from '../model/doctor-day';
import { leaveCovers, shiftMinutes } from '../model/rules';
import type { DoctorDayService, ScheduleService } from './doctor.service';

const HOLDS_A_SLOT = new Set(['Confirmed', 'CheckedIn', 'InProgress', 'Completed']);
const UPCOMING = new Set(['Confirmed', 'CheckedIn']);
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** The signed-in doctor, or `Doctor.ProfileNotFound`. */
function currentDoctor(deps: AuthMockDeps): DoctorSeed {
  const doctor = doctorForUser(deps.db, sessionUser(deps).id);
  if (!doctor) throw new ServiceError('Doctor.ProfileNotFound');
  return doctor;
}

const activeLeave = (db: MockDb, doctorId: string, statuses: LeaveRequest['status'][]) =>
  db.leaveRequests.filter((l) => l.doctorId === doctorId && statuses.includes(l.status));

/** The doctor's weekly shifts as they fall on `date`, with booked slots and leave (FR-SCH-01, FR-SCH-06). */
function shiftsOn(db: MockDb, doctor: DoctorSeed, date: string): ShiftDay[] {
  const approved = activeLeave(db, doctor.id, ['Approved']);
  return doctor.schedule
    .filter((s) => s.weekday === weekdayOf(date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((shift) => {
      const booked = db.appointments.filter(
        (a) => a.doctorId === doctor.id && a.branchId === shift.branchId && a.date === date && HOLDS_A_SLOT.has(a.status) &&
          toMinutes(a.startTime) >= toMinutes(shift.startTime) && toMinutes(a.startTime) < toMinutes(shift.endTime)
      ).length;
      return {
        date,
        branchId: shift.branchId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        room: roomOf(db, doctor.id, shift.branchId),
        slotsTotal: Math.floor(shiftMinutes(shift) / doctor.slotMinutes),
        slotsBooked: booked,
        onLeave: approved.some((l) => leaveCovers(l, date, shift.startTime, shift.endTime)),
      };
    });
}

export function createMockDoctorDayService(deps: AuthMockDeps): DoctorDayService {
  const { db, latencyMs } = deps;

  const toVisit = (record: AppointmentRecord): DoctorVisit => {
    const patient = findPatient(db, record.patientId);
    const encounter = db.encounters.find((e) => e.appointmentId === record.id && e.status !== 'Voided');
    const nurse = record.triage && db.users.find((u) => u.id === record.triage!.recordedBy);
    return {
      ...toDeskAppointment(db, record),
      queuePosition: record.queue?.position,
      triage: record.triage && structuredClone({ form: record.triage.form, recordedAt: record.triage.recordedAt, recordedByName: nurse?.fullName ?? '' }),
      allergies: structuredClone(patient?.allergies ?? []),
      encounterStatus: encounter?.status,
      calledAt: record.calledAt,
    };
  };

  return {
    async myDay(date) {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      return {
        date,
        visits: db.appointments
          .filter((a) => a.doctorId === doctor.id && a.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map(toVisit),
        shifts: shiftsOn(db, doctor, date),
      };
    },

    async unsigned() {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      return db.encounters
        .filter((e) => e.status === 'Draft')
        .map((e) => ({ encounter: e, record: db.appointments.find((a) => a.id === e.appointmentId) }))
        .filter(({ record }) => record?.doctorId === doctor.id && record.status === 'Completed')
        .map(({ record }) => ({
          appointmentId: record!.id,
          patientName: toDeskAppointment(db, record!).patient.fullName,
          serviceId: record!.serviceId,
          branchId: record!.branchId,
          date: record!.date,
          completedAt: record!.completedAt ?? record!.startsAtUtc,
        }))
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
    },
  };
}

export function createMockScheduleService(deps: AuthMockDeps): ScheduleService {
  const { db, latencyMs, now } = deps;

  const toView = (leave: LeaveRecord): LeaveRequest => {
    const view: Partial<LeaveRecord> = structuredClone(leave);
    delete view.doctorId;
    delete view.decidedBy;
    return view as LeaveRequest;
  };

  /** Booked visits a leave would touch, and the shifts it covers. */
  const impactOf = (doctor: DoctorSeed, input: Omit<LeaveRequestInput, 'reason'>): LeaveImpact => {
    const affected = db.appointments.filter(
      (a) => a.doctorId === doctor.id && UPCOMING.has(a.status) && leaveCovers(input, a.date, a.startTime, a.endTime)
    );
    const byBranch = [...new Set(affected.map((a) => a.branchId))].map((branchId) => ({ branchId, count: affected.filter((a) => a.branchId === branchId).length }));
    let shifts = 0;
    for (let date = input.fromDate; date <= input.toDate; date = addDays(date, 1)) {
      shifts += shiftsOn(db, doctor, date).filter((s) => leaveCovers(input, date, s.startTime, s.endTime)).length;
    }
    return { affected: affected.length, byBranch, shifts };
  };

  /** Dates in order, both times or neither, the start before the end, not in the past (branch date). */
  const validate = (doctor: DoctorSeed, input: Omit<LeaveRequestInput, 'reason'>) => {
    const today = todayAt(db, doctor.schedule[0]?.branchId ?? 'br-nc', now());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.toDate) || input.toDate < input.fromDate) {
      throw new ServiceError('Leave.InvalidRange');
    }
    if (!!input.startTime !== !!input.endTime || (input.startTime && input.endTime && input.startTime >= input.endTime)) {
      throw new ServiceError('Leave.InvalidRange');
    }
    if (input.fromDate < today) throw new ServiceError('Leave.InPast');
  };

  return {
    async myWeek(weekStart) {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((date) => ({ date, shifts: shiftsOn(db, doctor, date) }));
      const minutes = days.flatMap((d) => d.shifts).filter((s) => !s.onLeave).reduce((sum, s) => sum + shiftMinutes(s), 0);
      return { weekStart, days, minutes };
    },

    async listMyLeave() {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      return db.leaveRequests
        .filter((l) => l.doctorId === doctor.id)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .map(toView);
    },

    async previewLeave(input) {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      validate(doctor, input);
      return impactOf(doctor, input);
    },

    async requestLeave(input) {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      validate(doctor, input);
      if (!input.reason.trim()) throw new ServiceError('Leave.ReasonRequired');
      const overlaps = activeLeave(db, doctor.id, ['Requested', 'Approved']).some((l) => l.fromDate <= input.toDate && input.fromDate <= l.toDate);
      if (overlaps) throw new ServiceError('Leave.Overlaps');
      const year = String(now().getUTCFullYear()).slice(2);
      const leave: LeaveRecord = {
        id: `lv-${crypto.randomUUID()}`,
        reference: `LV-${year}-${String(100 + db.leaveRequests.length).padStart(4, '0')}`,
        doctorId: doctor.id,
        fromDate: input.fromDate,
        toDate: input.toDate,
        startTime: input.startTime || undefined,
        endTime: input.endTime || undefined,
        reason: input.reason.trim(),
        status: 'Requested',
        // Counted at request time (FR-SCH-06); the manager's worklist recounts on approval
        affectedAppointments: impactOf(doctor, input).affected,
        requestedAt: now().toISOString(),
      };
      db.leaveRequests.push(leave);
      return toView(leave);
    },

    async cancelLeave(leaveId) {
      await delay(latencyMs);
      const doctor = currentDoctor(deps);
      const leave = db.leaveRequests.find((l) => l.id === leaveId && l.doctorId === doctor.id);
      if (!leave) throw new ServiceError('Leave.NotFound');
      const today = todayAt(db, doctor.schedule[0]?.branchId ?? 'br-nc', now());
      if ((leave.status !== 'Requested' && leave.status !== 'Approved') || leave.fromDate <= today) throw new ServiceError('Leave.InvalidStatusTransition');
      leave.status = 'Cancelled';
      return toView(leave);
    },
  };
}
