import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { createAppointment } from '@/mocks/booking';
import { delay } from '@/mocks/db';
import { findPatient, patientRecordFor, subscribeQueue } from '@/mocks/front-desk';
import { notify } from '@/mocks/notifications';
import type { AppointmentRecord } from '@/mocks/seed/patient-portal';
import { timeZoneOf } from '@/mocks/slot-availability';
import { ServiceError } from '@/shared/api/service-error';
import { todayIn } from '@/shared/lib/branch-time';
import type { Appointment } from '../model/appointment';
import type { PatientAppointmentsService, QueueStatusService, ReminderService, ReminderView } from './appointments.service';

// Columns the patient's view leaves out: the owner and the desk's working data.
const HIDDEN: (keyof AppointmentRecord)[] = [
  'patientId', 'patientUserId', 'slotId', 'calledAt', 'noShowAt', 'priorityReason', 'complaint', 'triage', 'triageDraft', 'extraLines',
];

/** The patient's copy, without the owner columns. */
const toView = (record: AppointmentRecord): Appointment => {
  const view: Partial<AppointmentRecord> = structuredClone(record);
  for (const key of HIDDEN) delete view[key];
  return view as Appointment;
};

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
      const record = createAppointment(db, patientRecordFor(db, user, now()), serviceId, slotId, now());
      db.appointments.push(record);
      notify(db, outboxDelayMs, user.id, 'AppointmentConfirmed', { appointment: record }, now);
      return toView(record);
    },

    async reschedule(appointmentId, slotId) {
      await delay(latencyMs);
      const old = own(appointmentId);
      assertChangeable(old);
      const record = createAppointment(db, findPatient(db, old.patientId)!, old.serviceId, slotId, now());
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
      if (!record.depositAmount) throw new ServiceError('Deposit.NotOffered');
      if (record.depositPaid) throw new ServiceError('Deposit.AlreadyPaid');
      if (record.status !== 'Confirmed') throw new ServiceError('Appointment.InvalidStatusTransition');
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
 * The patient's live place in line (the `/hubs/queue` push): the current status at once, then every
 * change the desk, the nurse or the doctor makes. The demo queue moves on its own (`mocks/queue-demo.ts`).
 */
export function createMockQueueStatusService({ db }: AuthMockDeps): QueueStatusService {
  return {
    watch(appointmentId, listener) {
      const record = db.appointments.find((a) => a.id === appointmentId);
      if (!record?.queue) return () => {};
      let last = JSON.stringify(record.queue);
      listener(structuredClone(record.queue));
      return subscribeQueue(db, (branchId) => {
        if (branchId !== record.branchId || !record.queue) return;
        const current = JSON.stringify(record.queue);
        if (current === last) return;
        last = current;
        listener(structuredClone(record.queue));
      });
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
