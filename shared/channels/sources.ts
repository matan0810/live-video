import { isHttpsUrl } from './url.ts';

/**
 * A channel source is either an https HLS address, or `mako:<path>` for Keshet 12 (N12)
 * streams, which only play with a short-lived ticket fetched just before playback.
 */
const MAKO_PREFIX = 'mako:';
const MAKO_PATH = /^\/stream\/hls\/live\/[\w/.-]+\.m3u8$/;
const MAKO_ORIGIN = 'https://mako-streaming.akamaized.net';
const MAKO_TICKET_URL = 'https://mass.mako.co.il/ClicksStatistics/entitlementsServicesV2.jsp';

export function isStreamSource(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.startsWith(MAKO_PREFIX)) return MAKO_PATH.test(value.slice(MAKO_PREFIX.length));
  return isHttpsUrl(value);
}

async function fetchMakoTicket(path: string, fetcher: typeof fetch): Promise<string> {
  const ticketUrl = `${MAKO_TICKET_URL}?et=gt&lp=${encodeURIComponent(path)}&rv=AKAMAI`;
  const response = await fetcher(ticketUrl);
  if (!response.ok) throw new Error(`Ticket request failed: HTTP ${response.status}`);

  const data: unknown = await response.json();
  const tickets =
    typeof data === 'object' && data !== null && 'tickets' in data ? data.tickets : null;
  const first: unknown = Array.isArray(tickets) ? tickets[0] : null;
  const ticket =
    typeof first === 'object' && first !== null && 'ticket' in first ? first.ticket : null;
  if (typeof ticket !== 'string' || ticket.length === 0) throw new Error('No ticket in response');
  return `${MAKO_ORIGIN}${path}?${ticket}`;
}

/** Turns a channel source into an address a player can load right now. */
export async function resolveStreamUrl(
  source: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (source.startsWith(MAKO_PREFIX)) {
    return fetchMakoTicket(source.slice(MAKO_PREFIX.length), fetcher);
  }
  return source;
}
