import { parseChannels } from '../../shared/channels/parseChannels';
import rawChannels from './channels.json';

/** The channel list shipped with the site; used until (or unless) the API provides one. */
export const bundledChannels = parseChannels(rawChannels);

export { GROUP_LABELS, CHANNEL_GROUPS } from '../../shared/channels/types';
export type { CatalogChannel, Channel, ChannelGroup } from '../../shared/channels/types';
