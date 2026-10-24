// Documents the patient shares with their doctors (FR-PAT-06, FR-EMR-08) and their insurance cards
// (FR-INS-03). The desk verifies a card before the insurer's share applies.

export interface PatientDocument {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  /** Set when a doctor attached it to a visit. */
  sharedWithDoctorName?: string;
}

export type PolicyStatus = 'Verified' | 'PendingVerification' | 'Expired';

export interface InsurancePolicy {
  id: string;
  payerName: string;
  planName?: string;
  memberNo: string;
  holderName: string;
  /** The share the plan covers for outpatient visits, when known. */
  coveragePercent?: number;
  validTo: string;
  isDefault: boolean;
  status: PolicyStatus;
}

export interface Payer {
  id: string;
  name: string;
}

export interface AddPolicyRequest {
  payerId: string;
  memberNo: string;
  holderName: string;
  validTo: string;
  cardFront: File;
  cardBack?: File;
}

// Upload rules (FR-EMR-08): PDF or images, at most 20 MB. The server checks again and scans them.
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;
export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.join(',');
export const CARD_ACCEPT = '.jpg,.jpeg,.png';

/** The error code for a file that can't be uploaded, or `null` when it's fine. */
export function checkDocument(file: Pick<File, 'name' | 'size'>, extensions: readonly string[] = DOCUMENT_EXTENSIONS) {
  const name = file.name.toLowerCase();
  if (!extensions.some((ext) => name.endsWith(ext))) return 'File.TypeNotAllowed' as const;
  if (file.size > MAX_DOCUMENT_BYTES) return 'File.TooLarge' as const;
  return null;
}
