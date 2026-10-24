import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { samplePdf } from '@/mocks/sample-pdf';
import type { VisitRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import type { VisitListItem, VisitSummary } from '../model/visit';
import type { VisitsService } from './visits.service';

const toSummary = (record: VisitRecord): VisitSummary => {
  const view: Partial<VisitRecord> = structuredClone(record);
  delete view.patientUserId;
  return view as VisitSummary;
};

export function createMockVisitsService(deps: AuthMockDeps): VisitsService {
  const { db, latencyMs } = deps;

  const own = (visitId: string) => {
    const user = sessionUser(deps);
    const record = db.visits.find((v) => v.id === visitId && v.patientUserId === user.id);
    if (!record) throw new ServiceError('Visit.NotFound');
    return record;
  };

  return {
    async listMine() {
      await delay(latencyMs);
      const user = sessionUser(deps);
      return db.visits
        .filter((v) => v.patientUserId === user.id)
        .sort((a, b) => b.startsAtUtc.localeCompare(a.startsAtUtc))
        .map(
          (v): VisitListItem => ({
            id: v.id,
            startsAtUtc: v.startsAtUtc,
            doctorId: v.doctorId,
            doctorName: v.doctorName,
            specialtyId: v.specialtyId,
            branchId: v.branchId,
            diagnoses: [...v.diagnoses],
            followUp: v.followUp && { ...v.followUp },
            prescriptionCount: v.prescriptions.length,
            orderCount: v.orders.length,
          })
        );
    },

    async getMine(visitId) {
      await delay(latencyMs);
      return toSummary(own(visitId));
    },

    async downloadPrescription(visitId) {
      await delay(latencyMs);
      const visit = own(visitId);
      if (!visit.prescriptions.length) throw new ServiceError('Visit.NoPrescription');
      return samplePdf(`Prescription ${visit.prescriptionCode ?? ''}`, [
        `${visit.doctorName} - ${visit.startsAtUtc.slice(0, 10)}`,
        ...visit.prescriptions.map((p) => `${p.drug} ${p.strength ?? ''}: ${p.dosage}${p.durationDays ? `, ${p.durationDays} days` : ''}`),
      ]);
    },
  };
}
