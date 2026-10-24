import { matchPath } from 'react-router-dom';
import type { CurrentUser } from '@/features/auth/model/user';
import { decideAccess } from './access';
import { screenRoutes } from './index';

/** Whether `user` may open `path` (a full pathname with parameters filled in). */
export function canOpenPath(user: CurrentUser, path: string): boolean {
  const pathname = path.split('?')[0];
  const route = screenRoutes.find((r) => matchPath(r.path, pathname));
  return !!route && decideAccess(user, route.access) === 'allow';
}
