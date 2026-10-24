import { useNavigate } from 'react-router-dom';
import { useSignOut } from './use-session';

/** Signs out, then opens the sign-in page. */
export function useSignOutAndLeave() {
  const signOut = useSignOut();
  const navigate = useNavigate();
  return {
    signOut: () => signOut.mutate(undefined, { onSuccess: () => navigate('/sign-in', { replace: true }) }),
    isPending: signOut.isPending,
  };
}
