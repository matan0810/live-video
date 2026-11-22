import { useCallback, useMemo, useState } from 'react';
import type { Channel } from '../channels';
import type { PlayerStatus } from '../player/useHlsPlayer';

/**
 * Channels to mark unavailable in the list: those whose stream failed in this visit, and
 * those kept on the list without any link, marked before anyone tries.
 */
export function useUnavailableChannels(channels: readonly Channel[]) {
  const [failedChannelIds, setFailedChannelIds] = useState<ReadonlySet<string>>(() => new Set());

  const unavailableChannelIds = useMemo(
    () =>
      new Set([
        ...failedChannelIds,
        ...channels.filter((channel) => channel.sources.length === 0).map(({ id }) => id),
      ]),
    [failedChannelIds, channels],
  );

  /** Fed by every player: a channel that plays again is no longer marked. */
  const handleStatusChange = useCallback((channelId: string, status: PlayerStatus) => {
    if (status === 'loading') return;
    setFailedChannelIds((current) => {
      const isUnavailable = status === 'error';
      if (current.has(channelId) === isUnavailable) return current;
      const next = new Set(current);
      if (isUnavailable) next.add(channelId);
      else next.delete(channelId);
      return next;
    });
  }, []);

  return { unavailableChannelIds, handleStatusChange };
}
