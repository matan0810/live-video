/**
 * Checks that every stream viewers are offered answers with a live HLS playlist they can
 * actually watch (sound, quality, a format browsers play, a server that allows the site):
 * the list saved in the admin area when API_URL is set and one was saved, else channels.json.
 *
 * Usage: [API_URL=https://…] [STATUS_FILE=status.json] node scripts/check-links.ts
 * Prints a Markdown report (in Hebrew, for the owner) and exits with code 1 when a channel
 * cannot be watched. With STATUS_FILE it also writes the results as JSON (shared/linkStatus.ts),
 * which the workflow stores for the admin area's status board.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { isSavedListCurrent, isVersion } from '../shared/channels/listVersion.ts';
import { parseChannels } from '../shared/channels/parseChannels.ts';
import { resolveStreamUrl } from '../shared/channels/sources.ts';
import type { CatalogChannel } from '../shared/channels/types.ts';
import type { LinkStatus } from '../shared/linkStatus.ts';
import { findStreamProblems } from '../shared/streamProblems.ts';
import { formatReport, LIMITATIONS, needsAttention, type SourceResult } from './linkReport.ts';

const CHANNELS_FILE = new URL('../src/channels/channels.json', import.meta.url);
const PACKAGE_FILE = new URL('../package.json', import.meta.url);
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
    const isSevere = problems.some((problem) => !LIMITATIONS.includes(problem));
    const state = isSevere ? 'problems' : problems.length > 0 ? 'limited' : 'ok';
    return { url, state, detail: 'OK', problems };
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
    // Viewers get the release's list when the saved one predates it (see listVersion.ts).
    const appVersion =
      typeof body === 'object' &&
      body !== null &&
      'appVersion' in body &&
      isVersion(body.appVersion)
        ? body.appVersion
        : null;
    const { version } = JSON.parse(await readFile(PACKAGE_FILE, 'utf8')) as { version: string };
    if (!isSavedListCurrent(appVersion, version)) {
      return await fromCode(`הרשימה שבניהול ישנה מגרסה ${version}`);
    }
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
if (process.env.STATUS_FILE) {
  const status: LinkStatus = { checkedAt: new Date().toISOString(), from, channels: results };
  await writeFile(process.env.STATUS_FILE, JSON.stringify(status));
}
process.exitCode = needsAttention(results) ? 1 : 0;
