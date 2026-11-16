import { useCallback, useMemo } from 'react';
import type { Channel } from '../channels';
import { sanitizeCustomChannels } from '../channels/customChannels';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'live-video:custom-channels';

/** Channels the user added themselves. They live only in this browser. */
export function useCustomChannels() {
  const [stored, setStored] = useLocalStorage<unknown>(STORAGE_KEY, []);
  const customChannels = useMemo(() => sanitizeCustomChannels(stored), [stored]);

  const addCustomChannel = useCallback(
    (channel: Channel) => setStored([...customChannels, channel]),
    [customChannels, setStored],
  );

  const removeCustomChannel = useCallback(
    (channelId: string) => setStored(customChannels.filter(({ id }) => id !== channelId)),
    [customChannels, setStored],
  );

  return { customChannels, addCustomChannel, removeCustomChannel };
}
