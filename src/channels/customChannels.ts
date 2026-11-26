import type { Channel } from '../../shared/channels/types';
import { isHttpsUrl } from '../../shared/channels/url';
import { isRecord } from '../../shared/isRecord';

export const CUSTOM_ID_PREFIX = 'custom-';
const SHORT_LABEL_LENGTH = 3;

export type CustomChannelError = 'missing-name' | 'invalid-url';

export type CustomChannelResult =
  { ok: true; channel: Channel } | { ok: false; error: CustomChannelError };

export function isCustomChannelId(id: string) {
  return id.startsWith(CUSTOM_ID_PREFIX);
}

/** Builds a user-added channel from form input, or reports why the input is invalid. */
export function createCustomChannel(name: string, url: string): CustomChannelResult {
  const trimmedName = name.trim();
  const trimmedUrl = url.trim();
  if (trimmedName.length === 0) return { ok: false, error: 'missing-name' };
  if (!isHttpsUrl(trimmedUrl)) return { ok: false, error: 'invalid-url' };

  return {
    ok: true,
    channel: {
      id: `${CUSTOM_ID_PREFIX}${crypto.randomUUID().slice(0, 8)}`,
      name: trimmedName,
      short: [...trimmedName].slice(0, SHORT_LABEL_LENGTH).join(''),
      sources: [trimmedUrl],
    },
  };
}

function isCustomChannel(value: unknown): value is Channel {
  if (!isRecord(value)) return false;
  const { id, name, short, sources } = value;
  return (
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
