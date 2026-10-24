import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import type { ApplicationRecord } from '@/mocks/seed/applications';
import { ServiceError } from '@/shared/api/service-error';
import { addDays, todayIn } from '@/shared/lib/branch-time';
import type { DoctorApplication, StoredFileInfo } from '../model/application';
import { canWithdraw, isOpen } from '../model/stages';
import { checkApplicationFile } from '../model/files';
import type { ApplicationsService } from './applications.service';

/** Days before a rejected or withdrawn applicant may apply again (FR-REC-06 default). */
const REAPPLY_COOL_DOWN_DAYS = 90;

/** The applicant's copy, without the owner column. */
const toView = (record: ApplicationRecord): DoctorApplication => {
  const view: Partial<ApplicationRecord> = structuredClone(record);
  delete view.userId;
  return view as DoctorApplication;
};

export function createMockApplicationsService(deps: AuthMockDeps): ApplicationsService {
  const { db, latencyMs, now } = deps;

  const latestOf = (userId: string) =>
    db.applications.filter((a) => a.userId === userId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  const store = (file: File): StoredFileInfo => {
    const id = `file-${crypto.randomUUID()}`;
    db.files.set(id, file);
    return { id, fileName: file.name, sizeBytes: file.size, contentType: file.type };
  };

  return {
    async getMine() {
      await delay(latencyMs);
      const latest = latestOf(sessionUser(deps).id);
      return latest ? toView(latest) : null;
    },

    async apply(request) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      // FR-REC-01: verified phone and email, one open application, a clean CV
      if (!user.phoneVerified) throw new ServiceError('Auth.PhoneNotVerified');
      if (!user.email || !user.emailConfirmed) throw new ServiceError('Auth.EmailNotConfirmed');
      const latest = latestOf(user.id);
      if (latest && isOpen(latest.status)) throw new ServiceError('DoctorApplication.AlreadyOpen');
      if (latest?.canReapplyFrom && todayIn('Africa/Cairo', now()) < latest.canReapplyFrom) {
        throw new ServiceError('DoctorApplication.ReapplyTooSoon');
      }
      if (!request.cv) throw new ServiceError('DoctorApplication.CvRequired');
      for (const file of [request.cv, request.coverLetter]) {
        const problem = file && checkApplicationFile(file);
        if (problem) throw new ServiceError(problem);
      }

      const submittedAt = now().toISOString();
      const record: ApplicationRecord = {
        id: `app-${crypto.randomUUID()}`,
        userId: user.id,
        reference: `APP-${submittedAt.slice(0, 4)}-${String(1000 + db.applications.length).padStart(4, '0')}`,
        status: 'Applied',
        applicantName: user.fullName,
        phone: user.phone,
        email: user.email,
        specialtyId: request.specialtyId,
        licenseNo: request.licenseNo.trim(),
        yearsOfExperience: request.yearsOfExperience,
        preferredBranchId: request.preferredBranchId,
        submittedAt,
        cv: store(request.cv),
        coverLetter: request.coverLetter ? store(request.coverLetter) : undefined,
        coverLetterText: request.coverLetterText?.trim() || undefined,
        history: [{ id: crypto.randomUUID(), fromStatus: null, toStatus: 'Applied', changedAt: submittedAt, emailSent: true }],
      };
      db.applications.push(record);
      db.sentEmails.push({ to: user.email, kind: 'ApplicationStage', sentAt: submittedAt });
      return toView(record);
    },

    async withdraw() {
      await delay(latencyMs);
      const latest = latestOf(sessionUser(deps).id);
      if (!latest || !canWithdraw(latest.status)) throw new ServiceError('DoctorApplication.InvalidStatusTransition');
      const changedAt = now().toISOString();
      latest.history.unshift({ id: crypto.randomUUID(), fromStatus: latest.status, toStatus: 'Withdrawn', changedAt, emailSent: true });
      latest.status = 'Withdrawn';
      latest.interview = undefined;
      latest.canReapplyFrom = addDays(todayIn('Africa/Cairo', now()), REAPPLY_COOL_DOWN_DAYS);
      return toView(latest);
    },

    async downloadFile(fileId) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      const owned = db.applications.some(
        (a) => a.userId === user.id && (a.cv.id === fileId || a.coverLetter?.id === fileId)
      );
      if (!owned) throw new ServiceError('File.NotFound');
      // Seeded applications have no real file behind them
      return db.files.get(fileId) ?? new Blob(['Sample document from the ClinicFlow demo data.'], { type: 'text/plain' });
    },
  };
}
