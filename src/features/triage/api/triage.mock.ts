import { requirePermission, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { findPatient, moveToStage, patientIdentity, toQueueEntry } from '@/mocks/front-desk';
import { ServiceError } from '@/shared/api/service-error';
import { implausibleKeys, type TriageForm } from '../model/vitals';
import type { TriageService } from './triage.service';

export function createMockTriageService(deps: AuthMockDeps): TriageService {
  const { db, latencyMs, now } = deps;

  /** A visit waiting for triage that the nurse may work on. */
  const waiting = (appointmentId: string) => {
    const record = db.appointments.find((a) => a.id === appointmentId);
    if (!record?.queue) throw new ServiceError('Appointment.NotFound');
    const user = requirePermission(deps, 'vitals.write', record.branchId);
    return { record, user };
  };

  const assertWaiting = (stage: string) => {
    if (stage !== 'WaitingTriage') throw new ServiceError('Appointment.InvalidStatusTransition');
  };

  const clean = (form: TriageForm): TriageForm => ({ ...form, chiefComplaint: form.chiefComplaint?.trim() || undefined });

  return {
    async get(appointmentId) {
      await delay(latencyMs);
      const { record } = waiting(appointmentId);
      const patient = findPatient(db, record.patientId)!;
      return structuredClone({
        entry: toQueueEntry(db, record),
        patient: {
          mrn: patient.mrn,
          fullName: patientIdentity(db, patient).fullName,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          bloodType: patient.bloodType,
          allergies: patient.allergies,
          conditions: patient.conditions,
        },
        draft: record.triageDraft,
      });
    },

    async saveDraft(appointmentId, form) {
      await delay(latencyMs);
      const { record } = waiting(appointmentId);
      assertWaiting(record.queue!.stage);
      const savedAt = now().toISOString();
      record.triageDraft = { form: clean(form), savedAt };
      return { savedAt };
    },

    async submit(appointmentId, form) {
      await delay(latencyMs);
      const { record, user } = waiting(appointmentId);
      assertWaiting(record.queue!.stage);
      if (implausibleKeys(form).length > 0) throw new ServiceError('Vitals.OutOfRange');
      if (!form.allergiesConfirmed) throw new ServiceError('Triage.AllergiesNotConfirmed');
      // Recorded by and at (FR-EMR-02); the doctor's encounter reads these from phase 4
      record.triage = { form: clean(form), recordedBy: user.id, recordedAt: now().toISOString() };
      record.triageDraft = undefined;
      moveToStage(db, record, 'ReadyForDoctor', now());
      return toQueueEntry(db, record);
    },
  };
}
