import type { AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { findPatient, nextMrn, patientIdentity, toPatientSummary } from '@/mocks/front-desk';
import type { PatientRecordSeed } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { toE164EgyptianMobile } from '@/shared/lib/phone';
import { matchesFilter } from '../model/patient';
import { isLikelyDuplicate, matchesQuery } from '../model/search';
import type { PatientsService } from './patients.service';

const MAX_RESULTS = 20;

export function createMockPatientsService({ db, latencyMs, now }: AuthMockDeps): PatientsService {
  /** A record with its current name and phone, in the shape the search rules read. */
  const searchable = (record: PatientRecordSeed) => ({ ...record, ...patientIdentity(db, record) });

  return {
    async search(query, filter = 'all') {
      await delay(latencyMs);
      return db.patients
        .filter((record) => matchesQuery(searchable(record), query))
        .map((record) => toPatientSummary(db, record))
        .filter((patient) => matchesFilter(patient, filter))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .slice(0, MAX_RESULTS);
    },

    async get(patientId) {
      await delay(latencyMs);
      const record = findPatient(db, patientId);
      if (!record) throw new ServiceError('Patient.NotFound');
      return toPatientSummary(db, record);
    },

    async findDuplicates(candidate) {
      await delay(latencyMs);
      const phone = candidate.phone ? (toE164EgyptianMobile(candidate.phone) ?? undefined) : undefined;
      return db.patients
        .filter((record) => isLikelyDuplicate(searchable(record), { ...candidate, phone }))
        .map((record) => toPatientSummary(db, record));
    },

    async register(request) {
      await delay(latencyMs);
      const phone = toE164EgyptianMobile(request.phone);
      if (!phone) throw new ServiceError('Validation.InvalidPhone');
      const emergencyPhone = request.emergencyContactPhone ? toE164EgyptianMobile(request.emergencyContactPhone) : undefined;
      if (request.emergencyContactPhone && !emergencyPhone) throw new ServiceError('Validation.InvalidPhone');
      const mrn = nextMrn(db);
      const record: PatientRecordSeed = {
        id: `pat-${mrn.slice(4)}`,
        mrn,
        fullName: request.fullName.trim(),
        phone,
        gender: request.gender,
        dateOfBirth: request.dateOfBirth,
        nationalId: request.nationalId?.trim() || undefined,
        emergencyContactName: request.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: emergencyPhone ?? undefined,
        memberSince: now().toISOString().slice(0, 10),
        allergies: [],
        conditions: [],
        notificationChannel: 'Phone',
      };
      db.patients.push(record);
      return toPatientSummary(db, record);
    },
  };
}
