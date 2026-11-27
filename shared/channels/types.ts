export const CHANNEL_GROUPS = [
  'israel',
  'world',
  'arabic',
  'languages',
  'radio-national',
  'radio-regional',
  'radio-languages',
  'radio-world',
] as const;

/** Radio stations are channels in these groups; the site shows them in a tab of their own. */
export const RADIO_GROUPS = [
  'radio-national',
  'radio-regional',
  'radio-languages',
  'radio-world',
] as const satisfies readonly (typeof CHANNEL_GROUPS)[number][];

/** Broadcast languages, as ISO 639-1 codes. */
export const CHANNEL_LANGUAGES = ['he', 'en', 'ar', 'fr', 'es', 'de', 'it', 'ru'] as const;

export type ChannelLanguage = (typeof CHANNEL_LANGUAGES)[number];

export type ChannelGroup = (typeof CHANNEL_GROUPS)[number];

/**
 * Ways a channel works only in part, which the viewer is told about: better a picture
 * without sound than nothing, as long as it says so. In the order they are shown.
 * `hevc`: its video is HEVC only, which some browsers cannot play; said only in those.
 */
export const CHANNEL_LIMITS = ['no-sound', 'low-quality', 'hevc'] as const;

export type ChannelLimit = (typeof CHANNEL_LIMITS)[number];

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
  /** How it works only in part, if it does; absent when it works fully. */
  limits?: ChannelLimit[];
  /**
   * Stream URLs in priority order: the first is the primary, the rest are fallbacks. HLS
   * playlists (`.m3u8`), or for radio also plain audio streams (MP3 or AAC, as Icecast serves).
   */
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
  'radio-national': 'he',
  'radio-regional': 'he',
  'radio-languages': null,
  'radio-world': 'en',
};
