export const CHANNEL_GROUPS = ['israel', 'world', 'languages'] as const;

export type ChannelGroup = (typeof CHANNEL_GROUPS)[number];

/** Anything the player can play: a built-in channel or one the user added. */
export interface Channel {
  /** Stable identifier, used for persistence and URLs. Lowercase letters, digits and dashes. */
  id: string;
  /** Display name (Hebrew for Israeli channels). */
  name: string;
  /** English display name, when it differs from `name`. */
  nameEn?: string;
  /** Very short label shown on the channel tile (e.g. "11", "CNN"), and in place of a logo. */
  short: string;
  /** The channel's logo: a file in public/logos (e.g. "logos/kan11.svg") or an https address. */
  logo?: string;
  /** HLS playlist URLs in priority order: the first is the primary, the rest are fallbacks. */
  sources: string[];
}

/** A built-in channel from channels.json. */
export interface CatalogChannel extends Channel {
  group: ChannelGroup;
}
