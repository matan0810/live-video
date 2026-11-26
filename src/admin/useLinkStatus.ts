import { useEffect, useState } from 'react';
import type { LinkStatus } from '../../shared/linkStatus';
import { ApiError, fetchLinkStatus } from '../api/client';

/**
 * The latest daily link check for the status board: undefined while loading, null when
 * there is none yet (or the Worker predates the endpoint), 'unavailable' on failure. Loaded
 * apart from the rest, so it can never block the editor.
 */
export function useLinkStatus(token: string) {
  const [status, setStatus] = useState<LinkStatus | null | 'unavailable'>();

  useEffect(() => {
    let isCancelled = false;
    fetchLinkStatus(token)
      .then((loaded) => {
        if (!isCancelled) setStatus(loaded);
      })
      .catch((caught: unknown) => {
        if (isCancelled) return;
        if (caught instanceof ApiError && caught.status === 404) setStatus(null);
        else setStatus('unavailable');
      });
    return () => {
      isCancelled = true;
    };
  }, [token]);

  return status;
}
