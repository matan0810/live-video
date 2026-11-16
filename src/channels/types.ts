export const CHANNEL_GROUPS = ['israel', 'world'] as const;

export type ChannelGroup = (typeof CHANNEL_GROUPS)[number];

/** Anything the player can play: a built-in channel or one the user added. */
export interface Channel {
  /** Stable identifier, used for persistence and URLs. Lowercase letters, digits and dashes. */
  id: string;
  /** Display name. */
  name: string;
  /** Very short label shown on the channel tile (e.g. "11", "CNN"). */
  short: string;
  /** HLS playlist URLs in priority order: the first is the primary, the rest are fallbacks. */
  sources: string[];
}

/** A built-in channel from channels.json. */
export interface CatalogChannel extends Channel {
  group: ChannelGroup;
}

export const GROUP_LABELS: Record<ChannelGroup, string> = {
  israel: 'ישראל',
  world: 'עולם',
};
