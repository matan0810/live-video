import { useCallback, useMemo } from 'react';
import { channelsLike } from '../channels/channelKinds';
import { isRadio } from '../channels/isRadio';
import { stepChannel } from '../channels/stepChannel';
import type { Channel, ChannelGroup } from '../channels';
import { useMultiView } from '../multiview/useMultiView';

type ListedChannel = Channel & { group?: ChannelGroup };

/**
 * Which channel plays and how a pick is handled: directly, or into the multi-view grid
 * while it is open. Stepping (keys, the bar, the lock screen) stays within TV or radio.
 */
export function useChannelChoice(
  orderedChannels: readonly ListedChannel[],
  activeChannelId: string | null,
  selectChannel: (channelId: string | null) => void,
  maxTiles: number,
) {
  // Radio has no picture, so multi-view holds TV channels only.
  const multiView = useMultiView(maxTiles, (id) =>
    orderedChannels.some((channel) => channel.id === id && !isRadio(channel)),
  );
  /** The channel the list marks and stepping starts from: the heard one while watching several. */
  const currentChannelId = multiView.view?.focusedId ?? activeChannelId;
  const currentChannel = orderedChannels.find((channel) => channel.id === currentChannelId);
  /** What stepping and the full-screen bar move through: channels of the current kind. */
  const stepChannels = useMemo(
    () => channelsLike(orderedChannels, currentChannel),
    [orderedChannels, currentChannel],
  );

  // While watching several, a TV channel picked anywhere joins the grid instead of replacing
  // it; a radio station ends multi-view and plays.
  const chooseChannel = useCallback(
    (channelId: string) => {
      const picked = orderedChannels.find((channel) => channel.id === channelId);
      if (multiView.view && !(picked && isRadio(picked))) {
        multiView.pick(channelId);
        return;
      }
      if (multiView.view) multiView.exit();
      selectChannel(channelId);
    },
    [orderedChannels, multiView, selectChannel],
  );

  const selectByOffset = useCallback(
    (offset: 1 | -1) => {
      const next = stepChannel(stepChannels, currentChannelId, offset);
      if (next) chooseChannel(next.id);
    },
    [stepChannels, currentChannelId, chooseChannel],
  );

  return { multiView, currentChannelId, stepChannels, chooseChannel, selectByOffset };
}
