export const CHANNEL_GROUPS = ['israel', 'world', 'arabic', 'languages'] as const;

/** Broadcast languages, as ISO 639-1 codes. */
export const CHANNEL_LANGUAGES = ['he', 'en', 'ar', 'fr', 'es', 'de', 'it', 'ru'] as const;

export type ChannelLanguage = (typeof CHANNEL_LANGUAGES)[number];

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
  /** The language it broadcasts in. */
  language?: ChannelLanguage;
  /** HLS playlist URLs in priority order: the first is the primary, the rest are fallbacks. */
  sources: string[];
}

/** A built-in channel from channels.json. */
export interface CatalogChannel extends Channel {
  group: ChannelGroup;
}

/** The language most channels in a group speak; a channel in another language is marked. */
export const GROUP_LANGUAGES: Record<ChannelGroup, ChannelLanguage | null> = {
  israel: 'he',
  world: 'en',
  arabic: 'ar',
  languages: null,
};
