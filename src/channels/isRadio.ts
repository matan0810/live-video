import { RADIO_GROUP, type Channel, type ChannelGroup } from '../../shared/channels/types';

/** Whether a channel is a radio station (shown in the Radio tab, played without a picture). */
export function isRadio(channel: Channel & { group?: ChannelGroup }): boolean {
  return channel.group === RADIO_GROUP;
}
