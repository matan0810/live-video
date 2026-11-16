/**
 * Resolvers for channels whose stream address only works with a short-lived token.
 * Each one fetches a fresh, playable address from the broadcaster. A channel uses one
 * by listing `https://<worker>/stream/<id>` as its source.
 */
type StreamResolver = () => Promise<string>;

const MAKO_ORIGIN = 'https://mako-streaming.akamaized.net';
const MAKO_TICKET_URL = 'https://mass.mako.co.il/ClicksStatistics/entitlementsServicesV2.jsp';

/** Mako (Keshet 12 / N12) hands out an access ticket per stream path. */
async function resolveMakoStream(path: string): Promise<string> {
  const ticketUrl = `${MAKO_TICKET_URL}?et=gt&lp=${encodeURIComponent(path)}&rv=AKAMAI`;
  const response = await fetch(ticketUrl);
  if (!response.ok) throw new Error(`Ticket request failed with HTTP ${response.status}`);

  const data: { tickets?: { ticket?: string }[] } = await response.json();
  const ticket = data.tickets?.[0]?.ticket;
  if (!ticket) throw new Error('Ticket response had no ticket');
  return `${MAKO_ORIGIN}${path}?${ticket}`;
}

export const STREAM_RESOLVERS: Readonly<Record<string, StreamResolver>> = {
  n12: () => resolveMakoStream('/stream/hls/live/2033791/k12n12wad/index.m3u8'),
};
