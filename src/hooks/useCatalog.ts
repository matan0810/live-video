import { useEffect, useMemo } from 'react';
import { API_URL, fetchRemoteChannels } from '../api/client';
import { bundledChannels, type CatalogChannel } from '../channels';
import { effectiveChannels } from '../channels/effectiveChannels';
import { useLocalStorage } from './useLocalStorage';

const CACHE_KEY = 'live-video:remote-channels';

/**
 * The built-in channel list: the admin's saved list when it is current for this release,
 * else the release's own (see effectiveChannels). Starts from the last API answer (cached
 * locally) and refreshes in the background; any failure leaves the current list in place.
 */
export function useCatalog(): readonly CatalogChannel[] {
  const [cached, setCached] = useLocalStorage<unknown>(CACHE_KEY, null, (stored) => stored);
  const cachedJson = JSON.stringify(cached);

  useEffect(() => {
    if (!API_URL) return;
    let isCancelled = false;
    fetchRemoteChannels()
      .then((remote) => {
        // Skipping identical data keeps channel objects stable, so playback is not restarted.
        if (!isCancelled && JSON.stringify(remote) !== cachedJson) setCached(remote);
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [cachedJson, setCached]);

  return useMemo(() => effectiveChannels(cached, bundledChannels, __APP_VERSION__), [cached]);
}
