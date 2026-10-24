import type { DoctorApplication } from '../model/application';

/** `POST /api/v2/doctor-applications` (multipart/form-data). */
export interface ApplyRequest {
  specialtyId: string;
  licenseNo: string;
  yearsOfExperience: number;
  preferredBranchId?: string;
  cv: File;
  coverLetter?: File;
  coverLetterText?: string;
}

/** The applicant's side of recruitment (FR-REC-01, FR-REC-06). Needs a verified phone and email. */
export interface ApplicationsService {
  /** The signed-in user's latest application, or `null` if they never applied. */
  getMine(): Promise<DoctorApplication | null>;
  apply(request: ApplyRequest): Promise<DoctorApplication>;
  withdraw(): Promise<DoctorApplication>;
  /** One of the application's own files (CV or cover letter), to view or save. */
  downloadFile(fileId: string): Promise<Blob>;
}
