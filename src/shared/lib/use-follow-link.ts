import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Opens a link the backend returned: an app path ("/patient/…", e.g. the demo's checkout result) in
 * the router, anything else (Paymob's hosted checkout) as a full page load.
 */
export function useFollowLink() {
  const navigate = useNavigate();
  return useCallback(
    (url: string) => {
      if (url.startsWith('/') && !url.startsWith('//')) navigate(url);
      else window.location.assign(url);
    },
    [navigate]
  );
}
