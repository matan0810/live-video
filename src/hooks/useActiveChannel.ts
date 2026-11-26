import { useCallback, useState } from 'react';
import { readChannelParam, withChannelParam } from '../channels/channelLink';
import { storedString } from './storedValues';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'live-video:active-channel';

/**
 * The selected channel id. A shared link (?ch=…) wins on load, otherwise the last
 * watched channel is restored. Selecting a channel updates both the URL and storage.
 */
export function useActiveChannel() {
  const [storedId, setStoredId] = useLocalStorage<string | null>(STORAGE_KEY, null, storedString);
  const [activeId, setActiveId] = useState(
    () => readChannelParam(window.location.search) ?? storedId,
  );

  const select = useCallback(
    (channelId: string | null) => {
      setActiveId(channelId);
      setStoredId(channelId);
      window.history.replaceState(null, '', withChannelParam(window.location.href, channelId));
    },
    [setStoredId],
  );

  return [activeId, select] as const;
}
