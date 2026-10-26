import type { QueueStage } from '@/features/appointments/model/appointment';
import type { ChargeLine } from '@/features/billing/model/checkout';
import type { DeskAppointment } from '@/features/desk/model/desk';
import type { PatientSummary } from '@/features/patients/model/patient';
import type { QueueEntry, Room } from '@/features/queue/model/queue';
import type { UserSeed } from '@/mocks/seed/users';
import { nameIn } from '@/shared/i18n/bilingual';
import { todayIn } from '@/shared/lib/branch-time';
import type { MockDb } from './db';
import type { AppointmentRecord, PatientRecordSeed } from './seed/patient-portal';
import { timeZoneOf } from './slot-availability';

// What the front desk, queue, triage and checkout adapters share: they stand in for one backend, so
// a check-in on one screen shows on the queue board, the nurse's list and the patient's phone.

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export const todayAt = (db: MockDb, branchId: string, now: Date) => todayIn(timeZoneOf(db, branchId), now);

/** The record's name and phone: the account's when the patient has one, else what the desk typed. */
export function patientIdentity(db: MockDb, record: PatientRecordSeed) {
  const user = record.userId ? db.users.find((u) => u.id === record.userId) : undefined;
  return {
    fullName: user?.fullName ?? record.fullName ?? '',
    phone: user?.phone ?? record.phone ?? '',
    phoneVerified: !!user?.phoneVerified,
    language: user?.preferredLanguage ?? 'ar',
  };
}

export const findPatient = (db: MockDb, patientId: string) => db.patients.find((p) => p.id === patientId);

/** The next MRN, sequential per organization (FR-FD-02). */
export function nextMrn(db: MockDb): string {
  const last = Math.max(0, ...db.patients.map((p) => Number(p.mrn.replace(/\D/g, '')) || 0));
  return `MRN-${pad(last + 1, 6)}`;
}

/** The patient record of an account, created on first use for patients who signed up in the browser. */
export function patientRecordFor(db: MockDb, user: UserSeed, now: Date): PatientRecordSeed {
  let record = db.patients.find((p) => p.userId === user.id);
  if (!record) {
    const mrn = nextMrn(db);
    record = {
      id: `pat-${mrn.slice(4)}`,
      userId: user.id,
      mrn,
      memberSince: now.toISOString().slice(0, 10),
      allergies: [],
      conditions: [],
      notificationChannel: user.emailConfirmed ? 'Both' : 'Phone', // FR-NTF-04 default
    };
    db.patients.push(record);
  }
  return record;
}

/** The room the doctor's schedule reserves at the branch (FR-ORG-04). */
export function roomOf(db: MockDb, doctorId: string, branchId: string): Room | undefined {
  const link = db.doctorRooms.find((r) => r.doctorId === doctorId && r.branchId === branchId);
  const room = link && db.rooms.find((r) => r.id === link.roomId);
  return room && { id: room.id, nameEn: room.nameEn, nameAr: room.nameAr };
}

export const invoiceOf = (db: MockDb, appointmentId: string) => db.invoices.find((i) => i.appointmentId === appointmentId);

/** The visit's billed services: the booked one at the booked price, then any added at the desk. */
export function chargeLines(record: AppointmentRecord): ChargeLine[] {
  return [
    { id: `booked-${record.id}`, serviceId: record.serviceId, quantity: 1, unitPrice: record.price, total: record.price, booked: true },
    ...(record.extraLines ?? []).map((line) => ({ ...line, total: line.quantity * line.unitPrice, booked: false })),
  ];
}

/** Price, the deposit paid online, payments at the desk and what's left (FR-BIL-14). Exact to the piaster (R8). */
export function amounts(db: MockDb, record: AppointmentRecord) {
  const subtotal = chargeLines(record).reduce((sum, line) => sum + line.total, 0);
  const depositPaid = record.depositPaid && record.depositAmount ? Math.min(record.depositAmount, subtotal) : 0;
  const paidSoFar = db.payments
    .filter((p) => p.appointmentId === record.id && p.kind === 'Payment')
    .reduce((sum, p) => sum + p.amount, 0);
  const due = Math.max(0, Math.round((subtotal - depositPaid - paidSoFar) * 100) / 100);
  return { subtotal, depositPaid, paidSoFar, due };
}

/** What the patient owes across issued invoices (FR-BIL-12). */
export const balanceOf = (db: MockDb, patientId: string) =>
  db.invoices.filter((i) => i.patientId === patientId && (i.status === 'Issued' || i.status === 'PartiallyPaid')).reduce((sum, i) => sum + i.balanceDue, 0);

export function toPatientSummary(db: MockDb, record: PatientRecordSeed): PatientSummary {
  const identity = patientIdentity(db, record);
  const last = db.appointments
    .filter((a) => a.patientId === record.id && a.status === 'Completed')
    .sort((a, b) => b.startsAtUtc.localeCompare(a.startsAtUtc))[0];
  const policy = record.userId ? db.policies.find((p) => p.patientUserId === record.userId && p.isDefault) : undefined;
  return structuredClone({
    id: record.id,
    mrn: record.mrn,
    fullName: identity.fullName,
    phone: identity.phone,
    gender: record.gender,
    dateOfBirth: record.dateOfBirth,
    nationalId: record.nationalId,
    hasPortalAccount: !!record.userId,
    registeredAt: record.memberSince,
    lastVisit: last && { date: last.date, doctorName: last.doctorName },
    balanceDue: balanceOf(db, record.id),
    insurance: policy && { payerName: policy.payerName, status: policy.status },
  });
}

export function toDeskAppointment(db: MockDb, record: AppointmentRecord): DeskAppointment {
  const patient = findPatient(db, record.patientId);
  const identity = patient ? patientIdentity(db, patient) : { fullName: '', phone: '' };
  return structuredClone({
    id: record.id,
    reference: record.reference,
    status: record.status,
    source: record.source,
    patient: { id: record.patientId, fullName: identity.fullName, mrn: patient?.mrn ?? '', phone: identity.phone, dateOfBirth: patient?.dateOfBirth },
    doctorId: record.doctorId,
    doctorName: record.doctorName,
    specialtyId: record.specialtyId,
    serviceId: record.serviceId,
    branchId: record.branchId,
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    startsAtUtc: record.startsAtUtc,
    price: record.price,
    depositAmount: record.depositAmount,
    depositPaid: record.depositPaid,
    attendanceConfirmed: record.attendanceConfirmed,
    checkedInAt: record.checkedInAt,
    completedAt: record.completedAt,
    queue: record.queue && { ticketNo: record.queue.ticketNo, stage: record.queue.stage },
    room: roomOf(db, record.doctorId, record.branchId),
    amountDue: amounts(db, record).due,
    invoiced: !!invoiceOf(db, record.id),
  });
}

export function toQueueEntry(db: MockDb, record: AppointmentRecord): QueueEntry {
  const queue = record.queue!;
  const patient = findPatient(db, record.patientId);
  const identity = patient ? patientIdentity(db, patient) : { fullName: '' };
  const unslotted = record.slotId?.startsWith('walk-in|');
  const lateMinutes = unslotted || !record.checkedInAt
    ? 0
    : Math.max(0, Math.floor((Date.parse(record.checkedInAt) - Date.parse(record.startsAtUtc)) / 60_000));
  const vitals = record.triage?.form;
  return structuredClone({
    appointmentId: record.id,
    ticketNo: queue.ticketNo,
    stage: queue.stage,
    position: queue.position,
    patientId: record.patientId,
    patientName: identity.fullName,
    gender: patient?.gender,
    dateOfBirth: patient?.dateOfBirth,
    mrn: patient?.mrn ?? '',
    doctorId: record.doctorId,
    doctorName: record.doctorName,
    specialtyId: record.specialtyId,
    serviceId: record.serviceId,
    room: roomOf(db, record.doctorId, record.branchId),
    source: record.source,
    startTime: unslotted ? undefined : record.startTime,
    checkedInAt: record.checkedInAt ?? queue.checkedInAt ?? record.bookedAt,
    triagedAt: queue.triagedAt,
    calledAt: record.calledAt,
    completedAt: record.completedAt,
    lateMinutes,
    priorityReason: record.priorityReason,
    vitals: vitals && { systolic: vitals.systolic, diastolic: vitals.diastolic, pulse: vitals.pulse },
    allergies: patient?.allergies ?? [],
    complaint: record.triage?.form.chiefComplaint || record.complaint,
    amountDue: amounts(db, record).due,
  });
}

/** Today's visits with a queue ticket at the branch. */
export const queueRecords = (db: MockDb, branchId: string, now: Date) => {
  const today = todayAt(db, branchId, now);
  return db.appointments.filter((a) => a.branchId === branchId && a.date === today && a.queue);
};

/** The next ticket at the branch today (05 §3.3: per branch per day), lettered by the doctor. */
export function nextTicket(db: MockDb, record: AppointmentRecord, now: Date): string {
  const last = Math.max(0, ...queueRecords(db, record.branchId, now).map((a) => Number(a.queue!.ticketNo.split('-')[1]) || 0));
  const letter = record.doctorName.replace(/^Dr\.\s*/, '').charAt(0).toUpperCase() || 'T';
  return `${letter}-${pad(last + 1)}`;
}

/** Minutes a consultation takes on average, and triage, for the waits shown to patients (U3). */
const CONSULT_MINUTES = 7;
const TRIAGE_MINUTES = 4;

const inLine = (a: AppointmentRecord, b: AppointmentRecord) =>
  a.queue!.position - b.queue!.position || (a.checkedInAt ?? '').localeCompare(b.checkedInAt ?? '');

/**
 * Renumbers the lines after a change: triage across the branch, the doctor's line per doctor, and
 * refreshes each patient's estimated wait. Called by every adapter that moves someone.
 */
export function renumberQueue(db: MockDb, branchId: string, now: Date) {
  const records = queueRecords(db, branchId, now);
  const at = now.toISOString();
  const ready = (doctorId: string) => records.filter((a) => a.doctorId === doctorId && a.queue!.stage === 'ReadyForDoctor');

  records
    .filter((a) => a.queue!.stage === 'WaitingTriage')
    .sort(inLine)
    .forEach((a, index) => {
      a.queue!.position = index + 1;
      a.queue!.estimatedWaitMinutes = index * TRIAGE_MINUTES + 5 + ready(a.doctorId).length * CONSULT_MINUTES;
      a.queue!.updatedAt = at;
    });
  for (const doctorId of new Set(records.map((a) => a.doctorId))) {
    ready(doctorId)
      .sort(inLine)
      .forEach((a, index) => {
        a.queue!.position = index + 1;
        a.queue!.estimatedWaitMinutes = index * CONSULT_MINUTES + 5;
        a.queue!.updatedAt = at;
      });
  }
}

/** Tells everyone watching the branch's queue (the hub push). */
export function publishQueue(db: MockDb, branchId: string) {
  for (const listener of [...db.queueListeners]) listener(branchId);
}

export function subscribeQueue(db: MockDb, listener: (branchId: string) => void) {
  db.queueListeners.add(listener);
  return () => {
    db.queueListeners.delete(listener);
  };
}

/** Moves a visit to another queue stage and keeps the appointment status in step (05 §4.1). */
export function moveToStage(db: MockDb, record: AppointmentRecord, stage: QueueStage, now: Date) {
  const queue = record.queue!;
  const at = now.toISOString();
  queue.stage = stage;
  if (stage === 'ReadyForDoctor') {
    queue.triagedAt = at;
    queue.position = Number.MAX_SAFE_INTEGER;
  }
  if (stage === 'WithDoctor') {
    record.status = 'InProgress';
    record.calledAt = at;
    record.priorityReason = undefined;
    const room = roomOf(db, record.doctorId, record.branchId);
    Object.assign(queue, { position: 0, estimatedWaitMinutes: 0, doctorDelayMinutes: undefined, roomName: room?.nameEn ?? queue.roomName });
  }
  if (stage === 'Done') {
    record.status = 'Completed';
    record.completedAt = at;
    Object.assign(queue, { position: 0, estimatedWaitMinutes: 0 });
  }
  queue.updatedAt = at;
  renumberQueue(db, record.branchId, now);
  publishQueue(db, record.branchId);
}

/** Next receipt number across the organization ("RC-10013"). */
export function nextReceiptNo(db: MockDb): string {
  const last = Math.max(10_000, ...db.payments.filter((p) => p.kind === 'Payment').map((p) => Number(p.receiptNo.replace(/\D/g, '')) || 0));
  return `RC-${last + 1}`;
}

/** `<BRANCH>-<YYYY>-<000001>`, gapless per branch per year (FR-BIL-10). */
export function nextInvoiceNumber(db: MockDb, branchId: string, now: Date): string {
  const branch = db.branches.find((b) => b.id === branchId)!;
  const prefix = `${branch.code}-${todayAt(db, branchId, now).slice(0, 4)}-`;
  const last = Math.max(0, ...db.invoices.filter((i) => i.number.startsWith(prefix)).map((i) => Number(i.number.slice(prefix.length))));
  return `${prefix}${pad(last + 1, 6)}`;
}

/** The service's name in the patient's language, for invoice lines the patient reads. */
export function serviceName(db: MockDb, serviceId: string, language: 'ar' | 'en') {
  const service = db.services.find((s) => s.id === serviceId);
  return service ? nameIn(service, language) : serviceId;
}

/** The user's open cash session, if any (one per user, FR-BIL-09). */
export const openSessionOf = (db: MockDb, userId: string) => db.cashSessions.find((s) => s.openedBy === userId && s.status === 'Open');
