import { canAny, hasRole, needsMfaSetup } from '@/features/auth/model/access';
import type { CurrentUser } from '@/features/auth/model/user';
import type { Access } from './types';

/** What to do when a user opens a screen. */
export type AccessDecision = 'allow' | 'sign-in' | 'go-home' | 'setup-mfa' | 'forbidden';

export function decideAccess(user: CurrentUser | null, access: Access): AccessDecision {
  switch (access.kind) {
    case 'public':
      return 'allow';
    case 'guest':
      return user ? 'go-home' : 'allow';
    case 'signed-in':
      return user ? 'allow' : 'sign-in';
    case 'patient':
      if (!user) return 'sign-in';
      return hasRole(user, 'Patient') ? 'allow' : 'forbidden';
    case 'applicant':
      if (!user) return 'sign-in';
      return user.hasDoctorApplication ? 'allow' : 'forbidden';
    case 'permission':
      if (!user) return 'sign-in';
      // Staff without an authenticator can only reach the setup screen (FR-STF-07)
      if (needsMfaSetup(user)) return 'setup-mfa';
      return canAny(user, access.anyOf, access.minScope) ? 'allow' : 'forbidden';
  }
}
