import { canAny, hasRole, needsMfaSetup } from '@/features/auth/model/access';
import type { CurrentUser } from '@/features/auth/model/user';
import { PERMISSION_MODULE, type ModuleCode } from '@/features/entitlements/model/modules';
import type { Access } from './types';

/** What to do when a user opens a screen. */
export type AccessDecision = 'allow' | 'sign-in' | 'go-home' | 'setup-mfa' | 'forbidden' | 'module-off';

/**
 * Whether the clinic's plan leaves the screen out: its own module is off, or every permission that
 * could open it belongs to a module that is off. Either way it says "not in your plan", not "no
 * access", whoever asks.
 */
function moduleOff(access: Access, modules: ReadonlySet<ModuleCode>) {
  if (access.module && !modules.has(access.module)) return true;
  return access.kind === 'permission' && access.anyOf.every((permission) => !modules.has(PERMISSION_MODULE[permission]));
}

/**
 * `modules` are the clinic's enabled modules; without them (still loading, or a caller that doesn't
 * care) modules aren't checked. The session's user already lacks the grants of disabled modules
 * (`withModules`), so a screen open through another module's permission stays open.
 */
export function decideAccess(user: CurrentUser | null, access: Access, modules?: ReadonlySet<ModuleCode>): AccessDecision {
  if (modules && moduleOff(access, modules)) return 'module-off';
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
