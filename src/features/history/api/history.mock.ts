import { requirePermission, toCurrentUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { can } from '@/features/auth/model/access';
import type { PatientDocument } from '@/features/documents/model/documents';
import { bmi } from '@/features/triage/model/vitals';
import { doctorForUser } from '@/mocks/clinical';
import { delay } from '@/mocks/db';
import { findPatient, patientIdentity, todayAt } from '@/mocks/front-desk';
import { samplePdf } from '@/mocks/sample-pdf';
import { ServiceError } from '@/shared/api/service-error';
import { addDays } from '@/shared/lib/branch-time';
import { periodStart, type HistoryEncounter, type HistoryPrescription, type PatientHistory } from '../model/history';
import type { PatientHistoryService } from './history.service';

const VISITED = new Set(['CheckedIn', 'InProgress', 'Completed']);

export function createMockPatientHistoryService(deps: AuthMockDeps): PatientHistoryService {
  const { db, latencyMs, now } = deps;

  /** The history the signed-in user may see: visits at branches in their `encounters.view` scope (FR-EMR-12). */
  const build = (patientId: string, filter: { branchId?: string; period: '12m' | '24m' | 'all' }): PatientHistory => {
    const user = requirePermission(deps, 'encounters.view');
    const patient = findPatient(db, patientId);
    if (!patient) throw new ServiceError('Patient.NotFound');
    const current = toCurrentUser(db, user);
    const identity = patientIdentity(db, patient);
    const today = todayAt(db, 'br-nc', now());
    const myDoctorId = doctorForUser(db, user.id)?.id;
    const since = periodStart(filter.period, today);

    const visits = db.appointments
      .filter((a) => a.patientId === patientId && VISITED.has(a.status) && can(current, 'encounters.view', a.branchId))
      .filter((a) => (!filter.branchId || a.branchId === filter.branchId) && (!since || a.date >= since))
      .sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));

    const encounters: HistoryEncounter[] = visits
      .map((a) => ({ a, e: db.encounters.find((e) => e.appointmentId === a.id && e.status !== 'Voided') }))
      .filter(({ a, e }) => e || a.status !== 'Completed')
      .map(({ a, e }) => ({
        appointmentId: a.id,
        startsAtUtc: a.startsAtUtc,
        date: a.date,
        branchId: a.branchId,
        doctorName: a.doctorName,
        byMe: a.doctorId === myDoctorId,
        specialtyId: a.specialtyId,
        status: e?.status ?? 'Draft',
        inProgress: a.status !== 'Completed',
        chiefComplaint: a.triage?.form.chiefComplaint || a.complaint,
        assessment: e?.notes.assessment || undefined,
        plan: e?.notes.plan || undefined,
        diagnoses: e?.diagnoses ?? [],
        prescriptions: e?.prescriptions ?? [],
        orders: (e?.orders ?? []).map(({ type, description, status }) => ({ type, description, status })),
        addendaCount: e?.addenda.length ?? 0,
      }))
      .reverse();

    const prescriptions: HistoryPrescription[] = encounters
      .filter((e) => e.status === 'Signed')
      .flatMap((e) =>
        e.prescriptions.map((item) => ({
          ...item,
          startedOn: e.date,
          doctorName: e.doctorName,
          active: item.durationDays !== undefined && addDays(e.date, item.durationDays) >= today,
        }))
      );

    const policy = patient.userId ? db.policies.find((p) => p.patientUserId === patient.userId && p.isDefault) : undefined;
    return structuredClone({
      patient: {
        id: patient.id,
        fullName: identity.fullName,
        mrn: patient.mrn,
        phone: identity.phone,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        nationalId: patient.nationalId,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        conditions: patient.conditions,
        insurance: policy && { payerName: policy.payerName, memberNo: policy.memberNo, status: policy.status },
      },
      vitals: visits
        .filter((a) => a.triage)
        .map((a) => {
          const form = a.triage!.form;
          return { at: a.triage!.recordedAt, branchId: a.branchId, systolic: form.systolic, diastolic: form.diastolic, pulse: form.pulse, weightKg: form.weightKg, bmi: bmi(form) };
        }),
      encounters,
      prescriptions,
      documents: patient.userId
        ? db.documents.filter((d) => d.patientUserId === patient.userId).map((record): PatientDocument => {
            const doc: Partial<typeof record> = structuredClone(record);
            delete doc.patientUserId;
            delete doc.scanPassesAt;
            return doc as PatientDocument;
          })
        : [],
    });
  };

  return {
    async get(patientId, filter) {
      await delay(latencyMs);
      return build(patientId, filter);
    },

    async downloadSummary(patientId) {
      await delay(latencyMs);
      const history = build(patientId, { period: 'all' });
      return samplePdf(`Medical summary: ${history.patient.mrn}`, [
        `Allergies: ${history.patient.allergies.map((a) => a.name).join(', ') || 'none recorded'}`,
        `Conditions: ${history.patient.conditions.join(', ') || 'none recorded'}`,
        ...history.encounters.slice(0, 8).map((e) => `${e.date}: ${e.diagnoses.map((d) => `${d.code} ${d.title}`).join('; ') || e.chiefComplaint || '-'}`),
        ...history.prescriptions.filter((p) => p.active).map((p) => `Current: ${p.drugName} ${p.strength ?? ''}, ${p.dose} ${p.frequency}`),
      ]);
    },
  };
}
