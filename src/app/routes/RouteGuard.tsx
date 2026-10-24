import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { postSignInPath } from '@/features/auth/model/access';
import { useSession } from '@/features/auth/hooks/use-session';
import { LoadingState } from '@/shared/ui/states';
import ForbiddenPage from '../pages/ForbiddenPage';
import { decideAccess } from './access';
import { canOpenPath } from './can-open';
import type { Access } from './types';

/**
 * Applies a screen's access rule: signed-out users go to sign-in (remembering where they were
 * going), signed-in users on a guest page continue to that page or their home page, and missing
 * permissions show "no access". Doing the return-after-sign-in here keeps every sign-in path
 * (password, two-step code, demo account) consistent.
 */
export function RouteGuard({ access, children }: { access: Access; children: ReactNode }) {
  const { user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <LoadingState className="min-h-[50vh]" />;

  switch (decideAccess(user, access)) {
    case 'allow':
      return children;
    case 'sign-in':
      return <Navigate to="/sign-in" replace state={{ from: `${location.pathname}${location.search}` }} />;
    case 'go-home': {
      const from = (location.state as { from?: string } | null)?.from;
      return <Navigate to={postSignInPath(user!, from, (path) => canOpenPath(user!, path))} replace />;
    }
    case 'forbidden':
      return <ForbiddenPage />;
  }
}
