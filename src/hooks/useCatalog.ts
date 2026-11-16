import { useEffect, useMemo } from 'react';
import { parseChannels } from '../../shared/channels/parseChannels';
import { API_URL, fetchRemoteChannels } from '../api/client';
import { bundledChannels, type CatalogChannel } from '../channels';
import { useLocalStorage } from './useLocalStorage';

const CACHE_KEY = 'live-video:remote-channels';

function parseOrNull(data: unknown): CatalogChannel[] | null {
  try {
    const channels = parseChannels(data);
    return channels.length > 0 ? channels : null;
  } catch {
    return null;
  }
}

/**
 * The built-in channel list. Starts from the last list the API returned (cached locally)
 * or the one bundled with the site, then refreshes from the API in the background.
 * Any failure leaves the current list in place.
 */
export function useCatalog(): readonly CatalogChannel[] {
  const [cached, setCached] = useLocalStorage<unknown>(CACHE_KEY, null);
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

  return useMemo(() => parseOrNull(cached) ?? bundledChannels, [cached]);
}
