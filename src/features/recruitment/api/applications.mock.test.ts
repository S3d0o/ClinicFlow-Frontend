import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';
import type { ApplyRequest } from './applications.service';

const cv = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
const request: ApplyRequest = { specialtyId: 'sp-cardio', licenseNo: 'MOH-1', yearsOfExperience: 6, cv };

const rejectsWith = (promise: Promise<unknown>, code: string) =>
  expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

describe('doctor applications (FR-REC-01, FR-REC-06)', () => {
  it("shows the applicant's application with its history", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-nour' });
    const mine = await services.applications.getMine();
    expect(mine).toMatchObject({ status: 'Interview', interview: { interviewerName: 'Dr. Hala Mostafa' } });
    expect(mine!.history.map((h) => h.toStatus)).toEqual(['Interview', 'Applied']);
  });

  it('needs a confirmed email before applying', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' }); // no email
    await rejectsWith(services.applications.apply(request), 'Auth.EmailNotConfirmed');
  });

  it('accepts one open application, which makes the user an applicant', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-ahmed' });
    expect((await services.auth.getCurrentUser())?.hasDoctorApplication).toBe(false);

    const application = await services.applications.apply({ ...request, coverLetterText: '  Hello  ' });
    expect(application).toMatchObject({ status: 'Applied', coverLetterText: 'Hello', cv: { fileName: 'cv.pdf' } });
    expect((await services.auth.getCurrentUser())?.hasDoctorApplication).toBe(true);
    await rejectsWith(services.applications.apply(request), 'DoctorApplication.AlreadyOpen');
  });

  it('refuses files that are not PDF or DOCX', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-ahmed' });
    await rejectsWith(services.applications.apply({ ...request, cv: new File(['x'], 'cv.png') }), 'File.TypeNotAllowed');
  });

  it('lets the applicant withdraw before a decision, with a cool-down before applying again', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-nour' });
    const withdrawn = await services.applications.withdraw();
    expect(withdrawn).toMatchObject({ status: 'Withdrawn', canReapplyFrom: '2027-01-22' });
    await rejectsWith(services.applications.withdraw(), 'DoctorApplication.InvalidStatusTransition');
  });

  it("serves only the applicant's own files", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-nour' });
    expect(await services.applications.downloadFile('file-nour-cv')).toBeInstanceOf(Blob);
    await rejectsWith(services.applications.downloadFile('file-someone-else'), 'File.NotFound');
  });
});
