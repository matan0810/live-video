/**
 * Checks that every stream viewers are offered answers with a live HLS playlist they can
 * actually watch (sound, quality, a format browsers play, a server that allows the site):
 * the list saved in the admin area when API_URL is set and one was saved, else channels.json.
 *
 * Usage: [API_URL=https://…] node scripts/check-links.ts
 * Prints a Markdown report (in Hebrew, for the owner) and exits with code 1 when a channel
 * cannot be watched.
 */
import { readFile } from 'node:fs/promises';
import { parseChannels } from '../shared/channels/parseChannels.ts';
import { resolveStreamUrl } from '../shared/channels/sources.ts';
import type { CatalogChannel } from '../shared/channels/types.ts';
import { findStreamProblems } from '../shared/streamProblems.ts';
import { formatReport, needsAttention, type SourceResult } from './linkReport.ts';

const CHANNELS_FILE = new URL('../src/channels/channels.json', import.meta.url);
const TIMEOUT_MS = 15_000;
const HLS_SIGNATURE = '#EXTM3U';
const SITE_ORIGIN = 'https://matan0810.github.io';
/** Hosts that refuse anyone outside Israel, where the check runs; a failure there says nothing. */
const ISRAEL_ONLY_HOSTS = new Set(['kancdn.medonecdn.net']);
// Some CDNs refuse requests that do not look like they come from a browser.
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function checkSource(url: string): Promise<SourceResult> {
  const down = (detail: string): SourceResult => ({
    url,
    state: URL.canParse(url) && ISRAEL_ONLY_HOSTS.has(new URL(url).hostname) ? 'abroad' : 'down',
    detail,
    problems: [],
  });
  try {
    const response = await fetch(await resolveStreamUrl(url), {
      headers: { 'User-Agent': USER_AGENT, Origin: SITE_ORIGIN },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return down(`HTTP ${response.status}`);

    const body = await response.text();
    if (!body.trimStart().startsWith(HLS_SIGNATURE)) return down('not an HLS playlist');
    const allowed = response.headers.get('Access-Control-Allow-Origin');
    const problems = findStreamProblems(body, allowed, SITE_ORIGIN);
    return { url, state: problems.length > 0 ? 'problems' : 'ok', detail: 'OK', problems };
  } catch (error) {
    return down(error instanceof Error ? String(error.cause ?? error) : String(error));
  }
}

/** The live list from the Worker, or the code's list when there is none or it cannot be read. */
async function loadChannels(): Promise<{ channels: CatalogChannel[]; from: string }> {
  const fromCode = async (why: string) => ({
    channels: parseChannels(JSON.parse(await readFile(CHANNELS_FILE, 'utf8'))),
    from: `הרשימה שבקוד (${why})`,
  });
  const apiUrl = process.env.API_URL?.replace(/\/+$/, '');
  if (!apiUrl) return fromCode('לא הוגדר API_URL');
  try {
    const response = await fetch(`${apiUrl}/channels`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return await fromCode(`הוורקר ענה HTTP ${response.status}`);
    const body: unknown = await response.json();
    const saved =
      typeof body === 'object' && body !== null && 'channels' in body ? body.channels : null;
    if (saved === null || saved === undefined) return await fromCode('לא נשמרה רשימה בניהול');
    return { channels: parseChannels(saved), from: 'הרשימה שבניהול' };
  } catch (error) {
    return fromCode(`אין גישה לוורקר: ${error instanceof Error ? error.message : error}`);
  }
}

const { channels, from } = await loadChannels();
const results = await Promise.all(
  channels.map(async (channel) => ({
    name: channel.name,
    id: channel.id,
    sources: await Promise.all(channel.sources.map(checkSource)),
  })),
);

console.log(formatReport(results, from));
process.exitCode = needsAttention(results) ? 1 : 0;
