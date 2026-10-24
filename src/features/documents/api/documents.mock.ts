import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { samplePdf } from '@/mocks/sample-pdf';
import type { DocumentRecord, PolicyRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { CARD_ACCEPT, checkDocument, type InsurancePolicy, type PatientDocument } from '../model/documents';
import type { DocumentsService, InsuranceService } from './documents.service';

const strip = <T extends { patientUserId: string }>(record: T): Omit<T, 'patientUserId'> => {
  const view: Partial<T> = structuredClone(record);
  delete view.patientUserId;
  return view as Omit<T, 'patientUserId'>;
};

export function createMockDocumentsService(deps: AuthMockDeps): DocumentsService {
  const { db, latencyMs, now } = deps;

  const own = (documentId: string) => {
    const user = sessionUser(deps);
    const record = db.documents.find((d) => d.id === documentId && d.patientUserId === user.id);
    if (!record) throw new ServiceError('File.NotFound');
    return record;
  };

  return {
    async listMine() {
      await delay(latencyMs);
      const user = sessionUser(deps);
      return db.documents
        .filter((d) => d.patientUserId === user.id)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        .map((d): PatientDocument => strip(d));
    },

    async upload(file) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      const problem = checkDocument(file);
      if (problem) throw new ServiceError(problem);
      const record: DocumentRecord = {
        patientUserId: user.id,
        id: `doc-${crypto.randomUUID()}`,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        uploadedAt: now().toISOString(),
      };
      db.files.set(record.id, file);
      db.documents.push(record);
      return strip(record);
    },

    async download(documentId) {
      await delay(latencyMs);
      const record = own(documentId);
      return db.files.get(record.id) ?? samplePdf(record.fileName, ['Uploaded by the patient.']);
    },

    async remove(documentId) {
      await delay(latencyMs);
      const record = own(documentId);
      db.documents.splice(db.documents.indexOf(record), 1);
      db.files.delete(record.id);
    },
  };
}

export function createMockInsuranceService(deps: AuthMockDeps): InsuranceService {
  const { db, latencyMs } = deps;
  const cardExtensions = CARD_ACCEPT.split(',');

  return {
    async listMine() {
      await delay(latencyMs);
      const user = sessionUser(deps);
      return db.policies.filter((p) => p.patientUserId === user.id).map((p): InsurancePolicy => strip(p));
    },

    async listPayers() {
      await delay(latencyMs);
      return db.payers.map((p) => ({ ...p }));
    },

    async add({ payerId, memberNo, holderName, validTo, cardFront, cardBack }) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      for (const card of [cardFront, cardBack]) {
        const problem = card && checkDocument(card, cardExtensions);
        if (problem) throw new ServiceError(problem);
      }
      const payer = db.payers.find((p) => p.id === payerId);
      if (!payer) throw new ServiceError('Payer.NotFound');
      const mine = db.policies.filter((p) => p.patientUserId === user.id);
      const record: PolicyRecord = {
        patientUserId: user.id,
        id: `pol-${crypto.randomUUID()}`,
        payerName: payer.name,
        memberNo: memberNo.trim(),
        holderName: holderName.trim(),
        validTo,
        isDefault: mine.length === 0,
        // The desk checks the card against the insurer before its share applies (FR-INS-03, FR-INS-04)
        status: 'PendingVerification',
      };
      db.policies.push(record);
      return strip(record);
    },
  };
}
