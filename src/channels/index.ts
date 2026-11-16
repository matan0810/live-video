import rawChannels from './channels.json';
import { parseChannels } from './parseChannels';

export const catalogChannels = parseChannels(rawChannels);

export { GROUP_LABELS, CHANNEL_GROUPS } from './types';
export type { CatalogChannel, Channel, ChannelGroup } from './types';
