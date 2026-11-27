import type { Channel } from '../../shared/channels/types';
import type { ChannelKind } from './channelKinds';
import { isHttpsUrl } from '../../shared/channels/url';
import { isRecord } from '../../shared/isRecord';

export const CUSTOM_ID_PREFIX = 'custom-';
const OWN_STATION_GROUP = 'radio-world';
const SHORT_LABEL_LENGTH = 3;

export type CustomChannelError = 'invalid-url';

export type CustomChannelResult =
  { ok: true; channel: Channel } | { ok: false; error: CustomChannelError };

export function isCustomChannelId(id: string) {
  return id.startsWith(CUSTOM_ID_PREFIX);
}

/**
 * Builds a user-added channel from form input, or reports why the input is invalid. The
 * name is optional: a pasted link alone is enough, and the channel is named after its site.
 */
export function createCustomChannel(
  name: string,
  url: string,
  kind: ChannelKind = 'tv',
): CustomChannelResult {
  const trimmedUrl = url.trim();
  if (!isHttpsUrl(trimmedUrl)) return { ok: false, error: 'invalid-url' };
  const trimmedName = name.trim() || new URL(trimmedUrl).hostname.replace(/^www\./, '');

  return {
    ok: true,
    channel: {
      id: `${CUSTOM_ID_PREFIX}${crypto.randomUUID().slice(0, 8)}`,
      name: trimmedName,
      // Letters and digits only: a label from "tv.example.com" reads "tve", not "tv.".
      short: [...trimmedName]
        .filter((character) => /[\p{L}\p{N}]/u.test(character))
        .slice(0, SHORT_LABEL_LENGTH)
        .join(''),
      sources: [trimmedUrl],
      // A station of one's own is in a radio group, which is what plays and lists it as radio.
      ...(kind === 'radio' ? { group: OWN_STATION_GROUP } : {}),
    },
  };
}

function isCustomChannel(value: unknown): value is Channel {
  if (!isRecord(value)) return false;
  const { id, name, short, sources, group } = value;
  return (
    (group === undefined || group === OWN_STATION_GROUP) &&
    typeof id === 'string' &&
    isCustomChannelId(id) &&
    typeof name === 'string' &&
    typeof short === 'string' &&
    Array.isArray(sources) &&
    sources.length > 0 &&
    sources.every(isHttpsUrl)
  );
}

/** Keeps only well-formed channels from stored data, which may be stale or hand-edited. */
export function sanitizeCustomChannels(stored: unknown): Channel[] {
  return Array.isArray(stored) ? stored.filter(isCustomChannel) : [];
}
