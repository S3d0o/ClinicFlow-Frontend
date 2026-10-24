import type { RoleAssignment } from '@/features/auth/model/user';
import { BRANCH_IDS } from './branches';

/** A staff invitation (FR-STF-01). The real backend stores only a hash of the token. */
export interface InvitationSeed {
  token: string;
  email: string;
  fullName: string;
  roles: RoleAssignment[];
  invitedByUserId: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export const DEMO_INVITATION_TOKEN = 'demo-nurse-invite';

/** A nurse invited to Nasr City; the 72-hour link has two days left. */
export function invitationsSeed(now: Date): InvitationSeed[] {
  return [
    {
      token: DEMO_INVITATION_TOKEN,
      email: 'f.hassan@clinicflow.eg',
      fullName: 'Fatma Hassan Mahmoud',
      roles: [{ role: 'Nurse', scope: 'Branch', branchIds: [BRANCH_IDS.nasrCity] }],
      invitedByUserId: 'u-hala',
      expiresAt: new Date(now.getTime() + 48 * 3_600_000).toISOString(),
    },
  ];
}
