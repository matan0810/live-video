import { isRecord } from '../../shared/isRecord';
import { parseReport, type Report } from '../../shared/reports';
import { isHttpsUrl } from '../../shared/channels/url';
import { LINK_SOURCES, type FoundLink } from '../../shared/streamLinks';

/**
 * Checks of what the Worker answers: the site never takes an answer's shape on trust, so a
 * malformed one is refused here instead of breaking a screen.
 */

/** How the Worker's real-browser stage went, when the page itself held no link. */
export const BROWSER_OUTCOMES = [
  'not-needed',
  'used',
  'unavailable',
  'limit-reached',
  'failed',
] as const;
export type BrowserOutcome = (typeof BROWSER_OUTCOMES)[number];

export interface ExtractedLinks {
  links: FoundLink[];
  pagesScanned: number;
  browser: BrowserOutcome;
}

/** The list saved in the admin area (checked later, by the list rules) and its version. */
export interface RemoteChannels {
  channels: unknown;
  appVersion: unknown;
}

export function parseRemoteChannels(data: unknown): RemoteChannels | null {
  return isRecord(data) ? { channels: data.channels, appVersion: data.appVersion } : null;
}

export function parseToken(data: unknown): string | null {
  return isRecord(data) && typeof data.token === 'string' && data.token ? data.token : null;
}

/** The admin's reports; one that is malformed is left out rather than failing them all. */
export function parseReports(data: unknown): Report[] | null {
  if (!isRecord(data) || !Array.isArray(data.reports)) return null;
  return data.reports.flatMap((report: unknown) => parseReport(report) ?? []);
}

function parseFoundLink(data: unknown): FoundLink | null {
  if (!isRecord(data) || !isHttpsUrl(data.url)) return null;
  const source = LINK_SOURCES.find((known) => known === data.source);
  return source ? { url: data.url, source } : null;
}

export function parseExtractedLinks(data: unknown): ExtractedLinks | null {
  if (!isRecord(data) || !Array.isArray(data.links)) return null;
  const browser = BROWSER_OUTCOMES.find((known) => known === data.browser);
  const { pagesScanned } = data;
  if (!browser || typeof pagesScanned !== 'number') return null;
  return {
    links: data.links.flatMap((link: unknown) => parseFoundLink(link) ?? []),
    pagesScanned,
    browser,
  };
}
