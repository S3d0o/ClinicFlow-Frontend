import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { doctorForUser, encounterFor } from '@/mocks/clinical';
import { delay } from '@/mocks/db';
import { findPatient, moveToStage, patientIdentity, roomOf } from '@/mocks/front-desk';
import { notify } from '@/mocks/notifications';
import type { EncounterRecord } from '@/mocks/seed/clinical';
import type { AppointmentRecord, VisitRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { addDays } from '@/shared/lib/branch-time';
import { normalizeName } from '@/features/patients/model/search';
import type { Encounter, EncounterDraft } from '../model/encounter';
import { dosageText, followUpWindow, signBlockers } from '../model/rules';
import type { EncountersService } from './encounters.service';

const MAX_CODES = 20;
const MAX_DRUGS = 10;

export function createMockEncountersService(deps: AuthMockDeps): EncountersService {
  const { db, latencyMs, now, outboxDelayMs } = deps;

  /** The visit, if the signed-in user is its doctor (`encounters.write`, own). */
  const ownVisit = (appointmentId: string) => {
    const record = db.appointments.find((a) => a.id === appointmentId);
    if (!record) throw new ServiceError('Appointment.NotFound');
    const user = sessionUser(deps);
    if (doctorForUser(db, user.id)?.id !== record.doctorId) throw new ServiceError('Access.OutOfScope');
    const encounter = encounterFor(db, record, now());
    if (!encounter) throw new ServiceError('Appointment.InvalidStatusTransition'); // not checked in yet
    return { record, encounter, user };
  };

  const view = (record: AppointmentRecord, encounter: EncounterRecord): Encounter => {
    const patient = findPatient(db, record.patientId)!;
    const identity = patientIdentity(db, patient);
    const nurse = record.triage && db.users.find((u) => u.id === record.triage!.recordedBy);
    const signer = encounter.signedBy ? db.users.find((u) => u.id === encounter.signedBy) : undefined;
    return structuredClone({
      id: encounter.id,
      appointmentId: record.id,
      status: encounter.status,
      notes: encounter.notes,
      diagnoses: encounter.diagnoses,
      prescriptions: encounter.prescriptions,
      orders: encounter.orders,
      patientInstructions: encounter.patientInstructions,
      followUpInDays: encounter.followUpInDays,
      patient: {
        id: patient.id,
        fullName: identity.fullName,
        mrn: patient.mrn,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        conditions: patient.conditions,
      },
      visit: {
        reference: record.reference,
        doctorId: record.doctorId,
        doctorName: record.doctorName,
        specialtyId: record.specialtyId,
        branchId: record.branchId,
        serviceId: record.serviceId,
        startsAtUtc: record.startsAtUtc,
        status: record.status,
        ticketNo: record.queue?.ticketNo,
        stage: record.queue?.stage,
        checkedInAt: record.checkedInAt,
        calledAt: record.calledAt,
        room: roomOf(db, record.doctorId, record.branchId),
      },
      triage: record.triage && { form: record.triage.form, recordedAt: record.triage.recordedAt, recordedByName: nurse?.fullName ?? '' },
      addenda: encounter.addenda,
      signedAt: encounter.signedAt,
      signedByName: encounter.signedAt ? (signer?.fullName ?? record.doctorName) : undefined,
      rowVersion: encounter.rowVersion,
      savedAt: encounter.savedAt,
    });
  };

  const assertDraft = (encounter: EncounterRecord) => {
    if (encounter.status !== 'Draft') throw new ServiceError('Encounter.AlreadySigned');
  };

  /** Publishes the patient-facing summary (FR-EMR-13): plain diagnoses, medicines, tests, instructions; never the notes. */
  const publishSummary = (record: AppointmentRecord, encounter: EncounterRecord) => {
    if (!record.patientUserId) return; // no portal account: the summary prints at the desk
    const branch = db.branches.find((b) => b.id === record.branchId)!;
    const followUpService = db.services.find((s) => s.specialtyId === record.specialtyId && s.category === 'FollowUp');
    const visit: VisitRecord = {
      patientUserId: record.patientUserId,
      id: `visit-${record.id}`,
      appointmentId: record.id,
      appointmentReference: record.reference,
      startsAtUtc: record.startsAtUtc,
      doctorId: record.doctorId,
      doctorName: record.doctorName,
      specialtyId: record.specialtyId,
      branchId: record.branchId,
      diagnoses: encounter.diagnoses.filter((d) => d.status !== 'RuledOut').map((d) => d.title),
      prescriptions: encounter.prescriptions.map((item) => ({
        drug: item.drugName,
        strength: item.strength,
        genericName: db.drugs.find((d) => d.id === item.drugId)?.genericName,
        dosage: dosageText(item),
        durationDays: item.durationDays,
        instructions: item.instructions,
      })),
      prescriptionCode: encounter.prescriptions.length ? `RX-${branch.code}-${record.reference.slice(-5)}` : undefined,
      orders: encounter.orders.filter((o) => o.status !== 'Cancelled').map((o) => ({ name: o.description, status: o.status === 'ResultReceived' ? 'ResultReceived' : 'Pending' })),
      instructions: encounter.patientInstructions.split('\n').map((line) => line.trim()).filter(Boolean),
      followUp: encounter.followUpInDays
        ? { ...followUpWindow(record.date, encounter.followUpInDays, addDays), serviceId: followUpService?.id }
        : undefined,
    };
    db.visits = db.visits.filter((v) => v.id !== visit.id);
    db.visits.push(visit);
    record.visitId = visit.id;
    notify(db, outboxDelayMs, record.patientUserId, 'PrescriptionReady', { appointment: record }, now);
  };

  return {
    async get(appointmentId) {
      await delay(latencyMs);
      const { record, encounter } = ownVisit(appointmentId);
      return view(record, encounter);
    },

    async saveDraft(appointmentId, draft: EncounterDraft, rowVersion) {
      await delay(latencyMs);
      const { record, encounter } = ownVisit(appointmentId);
      assertDraft(encounter);
      if (rowVersion !== encounter.rowVersion) throw new ServiceError('Concurrency.Conflict');
      Object.assign(encounter, structuredClone(draft), { rowVersion: encounter.rowVersion + 1, savedAt: now().toISOString() });
      return view(record, encounter);
    },

    async sign(appointmentId, rowVersion) {
      await delay(latencyMs);
      const { record, encounter, user } = ownVisit(appointmentId);
      assertDraft(encounter);
      if (rowVersion !== encounter.rowVersion) throw new ServiceError('Concurrency.Conflict');
      if (record.status !== 'InProgress' && record.status !== 'Completed') throw new ServiceError('Appointment.InvalidStatusTransition');
      const patient = findPatient(db, record.patientId)!;
      const blockers = signBlockers(encounter, patient.allergies, db.drugs);
      if (blockers.noDiagnosis) throw new ServiceError('Encounter.DiagnosisRequired');
      if (blockers.allergyConflicts > 0) throw new ServiceError('Prescription.AllergyConflict');
      // Signed encounters and their prescriptions are immutable from here (FR-EMR-05, FR-EMR-09)
      Object.assign(encounter, { status: 'Signed', signedAt: now().toISOString(), signedBy: user.id, rowVersion: encounter.rowVersion + 1 });
      if (record.status === 'InProgress' && record.queue) moveToStage(db, record, 'Done', now());
      else if (record.status === 'InProgress') Object.assign(record, { status: 'Completed', completedAt: now().toISOString() });
      publishSummary(record, encounter);
      return view(record, encounter);
    },

    async completeVisit(appointmentId) {
      await delay(latencyMs);
      const { record, encounter } = ownVisit(appointmentId);
      if (record.status !== 'InProgress') throw new ServiceError('Appointment.InvalidStatusTransition');
      if (record.queue) moveToStage(db, record, 'Done', now());
      else Object.assign(record, { status: 'Completed', completedAt: now().toISOString() });
      return view(record, encounter);
    },

    async addAddendum(appointmentId, text) {
      await delay(latencyMs);
      const { record, encounter, user } = ownVisit(appointmentId);
      if (encounter.status !== 'Signed') throw new ServiceError('Encounter.InvalidStatusTransition');
      if (!text.trim()) throw new ServiceError('Encounter.AddendumRequired');
      encounter.addenda.push({ id: `add-${crypto.randomUUID()}`, text: text.trim(), authorName: user.fullName, signedAt: now().toISOString() });
      return view(record, encounter);
    },

    async searchIcd10(query) {
      await delay(latencyMs);
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];
      const words = q.split(/\s+/);
      return db.icd10
        .filter((c) => c.code.toLowerCase().startsWith(q) || words.every((w) => c.titleEn.toLowerCase().includes(w)))
        .slice(0, MAX_CODES)
        .map((c) => ({ ...c }));
    },

    async searchDrugs(query) {
      await delay(latencyMs);
      const q = normalizeName(query);
      if (q.length < 2) return [];
      return db.drugs
        .filter((d) => normalizeName(`${d.name} ${d.genericName}`).includes(q))
        .slice(0, MAX_DRUGS)
        .map((d) => structuredClone(d));
    },

    async listDrugs() {
      await delay(latencyMs);
      return structuredClone(db.drugs);
    },

    async listTemplates(specialtyId) {
      await delay(latencyMs);
      return structuredClone(db.encounterTemplates.filter((t) => t.specialtyId === specialtyId));
    },
  };
}

