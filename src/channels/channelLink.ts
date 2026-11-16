const CHANNEL_PARAM = 'ch';

/** Reads the channel id from a URL query string such as "?ch=kan11". */
export function readChannelParam(search: string): string | null {
  return new URLSearchParams(search).get(CHANNEL_PARAM) || null;
}

/** Returns `href` with its channel parameter set to the given channel, or removed for null. */
export function withChannelParam(href: string, channelId: string | null): string {
  const url = new URL(href);
  if (channelId === null) url.searchParams.delete(CHANNEL_PARAM);
  else url.searchParams.set(CHANNEL_PARAM, channelId);
  return url.toString();
}
