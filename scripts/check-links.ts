/**
 * Checks that every stream in channels.json still answers with an HLS playlist.
 *
 * Usage: node scripts/check-links.ts
 * Prints a Markdown report and exits with code 1 when any channel has no working source.
 */
import { readFile } from 'node:fs/promises';

interface ChannelEntry {
  id: string;
  name: string;
  sources: string[];
}

interface SourceResult {
  url: string;
  ok: boolean;
  detail: string;
}

const CHANNELS_FILE = new URL('../src/channels/channels.json', import.meta.url);
const TIMEOUT_MS = 15_000;
const HLS_SIGNATURE = '#EXTM3U';
// Some CDNs refuse requests that do not look like they come from a browser.
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function checkSource(url: string): Promise<SourceResult> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return { url, ok: false, detail: `HTTP ${response.status}` };

    const body = await response.text();
    return body.trimStart().startsWith(HLS_SIGNATURE)
      ? { url, ok: true, detail: 'OK' }
      : { url, ok: false, detail: 'not an HLS playlist' };
  } catch (error) {
    const reason = error instanceof Error ? (error.cause ?? error).toString() : String(error);
    return { url, ok: false, detail: reason };
  }
}

const channels = JSON.parse(await readFile(CHANNELS_FILE, 'utf8')) as ChannelEntry[];
const results = await Promise.all(
  channels.map(async (channel) => ({
    channel,
    sources: await Promise.all(channel.sources.map(checkSource)),
  })),
);

const dead = results.filter(({ sources }) => sources.every((source) => !source.ok));
const degraded = results.filter(
  ({ sources }) => sources.some((source) => source.ok) && sources.some((source) => !source.ok),
);

const describe = ({ channel, sources }: (typeof results)[number]) =>
  [
    `- **${channel.name}** (\`${channel.id}\`)`,
    ...sources
      .filter((source) => !source.ok)
      .map((source) => `  - ${source.detail}: ${source.url}`),
  ].join('\n');

console.log(
  `Checked ${results.length} channels: ${dead.length} down, ${degraded.length} degraded.`,
);
if (dead.length > 0) console.log(`\n### Down\n\n${dead.map(describe).join('\n')}`);
if (degraded.length > 0) {
  console.log(`\n### Working on a fallback\n\n${degraded.map(describe).join('\n')}`);
}

process.exitCode = dead.length > 0 ? 1 : 0;
