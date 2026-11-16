import rawChannels from './channels.json';
import { parseChannels } from './parseChannels';

export const channels = parseChannels(rawChannels);

export { GROUP_LABELS, CHANNEL_GROUPS } from './types';
export type { Channel, ChannelGroup } from './types';
