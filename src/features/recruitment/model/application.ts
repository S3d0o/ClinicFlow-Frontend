/** Doctor application stages (05 §4.6). */
export type ApplicationStatus = 'Applied' | 'Interview' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface StoredFileInfo {
  id: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

/** Interview stage variables (FR-REC-03). `at` is UTC; shown in the branch's zone. */
export interface InterviewDetails {
  at: string;
  branchId?: string;
  /** An address when the interview isn't at a branch. */
  location?: string;
  interviewerName: string;
  notes?: string;
}

/** Acceptance stage variables (FR-REC-03). `startDate` is branch-local. */
export interface AcceptanceDetails {
  startDate: string;
  branchId: string;
  notes?: string;
}

/** One entry of the append-only history (`DoctorApplicationStageChange`). */
export interface StageChange {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: string;
  interview?: InterviewDetails;
  acceptance?: AcceptanceDetails;
  /** The reviewer's message on a rejection. */
  message?: string;
  /** Whether the stage email reached the outbox's delivery step (FR-REC-04). */
  emailSent: boolean;
}

/** The applicant's own view of their application (`GET /api/v2/doctor-applications/mine`). */
export interface DoctorApplication {
  id: string;
  reference: string;
  status: ApplicationStatus;
  applicantName: string;
  phone: string;
  email: string;
  specialtyId: string;
  licenseNo: string;
  yearsOfExperience: number;
  preferredBranchId?: string;
  submittedAt: string;
  cv: StoredFileInfo;
  coverLetter?: StoredFileInfo;
  coverLetterText?: string;
  interview?: InterviewDetails;
  acceptance?: AcceptanceDetails;
  /** Newest first. */
  history: StageChange[];
  /** After a rejection or withdrawal: the first day a new application is accepted (FR-REC-06). */
  canReapplyFrom?: string;
}
