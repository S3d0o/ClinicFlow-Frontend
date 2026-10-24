import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { resolvePrice } from '@/features/catalog/model/pricing';
import { delay, type MockDb } from '@/mocks/db';
import { notify } from '@/mocks/notifications';
import type { AppointmentRecord } from '@/mocks/seed/patient-portal';
import { findSlot, timeZoneOf } from '@/mocks/slot-availability';
import { ServiceError } from '@/shared/api/service-error';
import { todayIn } from '@/shared/lib/branch-time';
import type { Appointment, QueueStatus } from '../model/appointment';
import { CHANGE_WINDOW_HOURS } from '../model/policy';
import type { PatientAppointmentsService, QueueStatusService, ReminderService, ReminderView } from './appointments.service';

/** The patient's copy, without the owner columns. */
const toView = (record: AppointmentRecord): Appointment => {
  const view: Partial<AppointmentRecord> = structuredClone(record);
  delete view.patientUserId;
  delete view.slotId;
  return view as Appointment;
};

const nextReference = (db: MockDb, now: Date) =>
  `CF-${String(now.getUTCFullYear()).slice(2)}-${String(9300 + db.appointments.length).padStart(5, '0')}`;

/** A new appointment in `slotId`, priced from the price list (FR-SVC-02) on the visit date. */
function createAppointment(db: MockDb, patientUserId: string, serviceId: string, slotId: string, now: Date): AppointmentRecord {
  const slot = findSlot(db, slotId, now);
  if (!slot) throw new ServiceError('Appointment.SlotInPast');
  if (!slot.available) throw new ServiceError('Slot.CapacityReached');
  const doctor = db.doctors.find((d) => d.id === slot.doctorId)!;
  if (!doctor.services.some((s) => s.serviceId === serviceId)) throw new ServiceError('Appointment.SlotNotAvailable');
  const service = db.services.find((s) => s.id === serviceId)!;
  const price = resolvePrice(db.priceList, { serviceId, branchId: slot.branchId, doctorId: doctor.id, date: slot.date }) ?? 0;
  const startsAt = Date.parse(slot.startsAtUtc);

  return {
    id: `apt-${crypto.randomUUID()}`,
    patientUserId,
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
    price,
    depositAmount: service.optionalDepositAmount || undefined,
    depositPaid: false,
    bookedAt: now.toISOString(),
    changeableUntil: new Date(startsAt - CHANGE_WINDOW_HOURS * 3_600_000).toISOString(),
    attendanceConfirmed: false,
    hasReview: false,
  };
}

export function createMockPatientAppointmentsService(deps: AuthMockDeps): PatientAppointmentsService {
  const { db, latencyMs, now, outboxDelayMs } = deps;

  const own = (appointmentId: string) => {
    const user = sessionUser(deps);
    const record = db.appointments.find((a) => a.id === appointmentId && a.patientUserId === user.id);
    if (!record) throw new ServiceError('Appointment.NotFound');
    return record;
  };

  /** Patients change a visit online only while it's `Confirmed` and inside the window (FR-PAT-09). */
  const assertChangeable = (record: AppointmentRecord) => {
    if (record.status !== 'Confirmed') throw new ServiceError('Appointment.InvalidStatusTransition');
    if (now().getTime() >= Date.parse(record.changeableUntil)) throw new ServiceError('Appointment.CancellationWindowExpired');
  };

  return {
    async listMine() {
      await delay(latencyMs);
      const user = sessionUser(deps);
      return db.appointments.filter((a) => a.patientUserId === user.id).map(toView);
    },

    async getMine(appointmentId) {
      await delay(latencyMs);
      return toView(own(appointmentId));
    },

    async book({ serviceId, slotId, acceptTerms }) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      if (!user.phoneVerified) throw new ServiceError('Auth.PhoneNotVerified');
      if (!acceptTerms) throw new ServiceError('Consent.Required');
      const record = createAppointment(db, user.id, serviceId, slotId, now());
      db.appointments.push(record);
      notify(db, outboxDelayMs, user.id, 'AppointmentConfirmed', { appointment: record }, now);
      return toView(record);
    },

    async reschedule(appointmentId, slotId) {
      await delay(latencyMs);
      const old = own(appointmentId);
      assertChangeable(old);
      const record = createAppointment(db, old.patientUserId, old.serviceId, slotId, now());
      // One transaction (FR-APT-05): the new booking, the old one Rescheduled, linked both ways, deposit carried
      record.rescheduledFromId = old.id;
      record.depositPaid = old.depositPaid;
      db.appointments.push(record);
      old.status = 'Rescheduled';
      old.rescheduledToId = record.id;
      notify(db, outboxDelayMs, old.patientUserId, 'AppointmentRescheduled', { appointment: record }, now);
      return toView(record);
    },

    async cancel(appointmentId, { reason }) {
      await delay(latencyMs);
      const record = own(appointmentId);
      assertChangeable(record);
      record.status = 'Cancelled';
      record.cancelledAt = now().toISOString();
      record.cancelledBy = 'Patient';
      record.cancellationReason = reason;
      notify(db, outboxDelayMs, record.patientUserId, 'AppointmentCancelled', { appointment: record }, now);
      return toView(record);
    },

    async startDepositCheckout(appointmentId) {
      await delay(latencyMs);
      const record = own(appointmentId);
      if (record.status !== 'Confirmed' || !record.depositAmount || record.depositPaid) {
        throw new ServiceError('Appointment.InvalidStatusTransition');
      }
      // The demo has no Paymob: the hosted checkout "succeeds" and its webhook marks the deposit paid
      record.depositPaid = true;
      notify(db, outboxDelayMs, record.patientUserId, 'DepositReceived', { appointment: record, amount: record.depositAmount }, now);
      return { checkoutUrl: `/patient/appointments/${record.id}?payment=success` };
    },

    async submitReview(appointmentId, { rating, comment }) {
      await delay(latencyMs);
      const record = own(appointmentId);
      if (record.status !== 'Completed') throw new ServiceError('Appointment.ReviewNotAllowed');
      if (record.hasReview) throw new ServiceError('Appointment.ReviewAlreadyExists');
      const user = sessionUser(deps);
      const [first, last] = user.fullName.split(' ');
      db.reviews.push({
        id: `rev-${crypto.randomUUID()}`,
        doctorId: record.doctorId,
        authorName: last ? `${first} ${last[0]}.` : first,
        rating,
        comment: comment?.trim() || undefined,
        createdAt: now().toISOString(),
      });
      record.hasReview = true;
    },
  };
}

/**
 * The queue moves in the demo: every `queueTickMs` the patient gets triaged, then moves up one place,
 * then is called in (`InProgress`). With 0 (tests) it stays where it is.
 */
export function createMockQueueStatusService({ db, now, queueTickMs }: AuthMockDeps): QueueStatusService {
  const advance = (record: AppointmentRecord, queue: QueueStatus) => {
    const at = now().toISOString();
    if (queue.stage === 'WaitingTriage') Object.assign(queue, { stage: 'ReadyForDoctor', triagedAt: at });
    else if (queue.stage === 'ReadyForDoctor' && queue.position > 1) {
      queue.position -= 1;
      queue.estimatedWaitMinutes = Math.max(5, queue.estimatedWaitMinutes - 7);
    } else if (queue.stage === 'ReadyForDoctor') {
      Object.assign(queue, { stage: 'WithDoctor', position: 0, estimatedWaitMinutes: 0, doctorDelayMinutes: undefined });
      record.status = 'InProgress';
    }
    queue.updatedAt = at;
  };

  return {
    watch(appointmentId, listener) {
      const record = db.appointments.find((a) => a.id === appointmentId);
      if (!record?.queue) return () => {};
      listener(structuredClone(record.queue));
      if (queueTickMs <= 0) return () => {};
      const timer = setInterval(() => {
        if (!record.queue || record.queue.stage === 'WithDoctor' || record.queue.stage === 'Done') return clearInterval(timer);
        advance(record, record.queue);
        listener(structuredClone(record.queue));
      }, queueTickMs);
      return () => clearInterval(timer);
    },
  };
}

export function createMockReminderService({ db, latencyMs, now, outboxDelayMs }: AuthMockDeps): ReminderService {
  const byToken = (token: string) => {
    const link = db.reminderTokens.find((t) => t.token === token);
    const record = link && db.appointments.find((a) => a.id === link.appointmentId);
    // A link stops working once the visit day has passed
    if (!record || record.date < todayIn(timeZoneOf(db, record.branchId), now())) throw new ServiceError('Reminder.LinkInvalid');
    return record;
  };

  const view = (record: AppointmentRecord): ReminderView => ({
    appointmentId: record.id,
    reference: record.reference,
    status: record.status,
    attendanceConfirmed: record.attendanceConfirmed,
    doctorName: record.doctorName,
    specialtyId: record.specialtyId,
    branchId: record.branchId,
    serviceId: record.serviceId,
    date: record.date,
    startTime: record.startTime,
    startsAtUtc: record.startsAtUtc,
    changeableUntil: record.changeableUntil,
    price: record.price,
  });

  return {
    async get(token) {
      await delay(latencyMs);
      return view(byToken(token));
    },
    async confirm(token) {
      await delay(latencyMs);
      const record = byToken(token);
      if (record.status !== 'Confirmed') throw new ServiceError('Appointment.InvalidStatusTransition');
      record.attendanceConfirmed = true;
      return view(record);
    },
    async cancel(token) {
      await delay(latencyMs);
      const record = byToken(token);
      if (record.status !== 'Confirmed') throw new ServiceError('Appointment.InvalidStatusTransition');
      if (now().getTime() >= Date.parse(record.changeableUntil)) throw new ServiceError('Appointment.CancellationWindowExpired');
      Object.assign(record, { status: 'Cancelled', cancelledAt: now().toISOString(), cancelledBy: 'Patient', cancellationReason: 'Other' });
      notify(db, outboxDelayMs, record.patientUserId, 'AppointmentCancelled', { appointment: record }, now);
      return view(record);
    },
  };
}
