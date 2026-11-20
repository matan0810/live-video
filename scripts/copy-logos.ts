/**
 * Copies every channel logo that still loads from another host into public/logos and points
 * channels.json at the copy, so viewers never depend on (or are refused by) those hosts.
 * Runs in the Sync channels workflow; Wikimedia throttles cloud sessions but not GitHub.
 *
 * Usage: node scripts/copy-logos.ts
 * Prints a Markdown summary. Files that cannot be fetched, are not images, are too big or
 * are unsafe SVGs are left remote and listed.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { parseChannels } from '../shared/channels/parseChannels.ts';
import { isSafeSvg, MAX_LOGO_BYTES, sniffImage } from './logoFiles.ts';

const CHANNELS_FILE = new URL('../src/channels/channels.json', import.meta.url);
const LOGOS_DIR = new URL('../public/logos/', import.meta.url);
// Wikimedia asks automated clients to say who they are and to go slowly.
const USER_AGENT = 'OnAir-logo-copy/1.0 (personal noncommercial site; GitHub Actions)';
const PAUSE_MS = 3000;
const TIMEOUT_MS = 20_000;

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS));

async function copy(id: string, url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_LOGO_BYTES) throw new Error(`${bytes.byteLength} bytes is too big`);
  const kind = sniffImage(bytes);
  if (!kind) throw new Error('not an image');
  if (kind === 'svg' && !isSafeSvg(new TextDecoder().decode(bytes))) {
    throw new Error('SVG with scripts or outside references');
  }
  const file = `${id}.${kind}`;
  await writeFile(new URL(file, LOGOS_DIR), bytes);
  return `logos/${file}`;
}

const raw: unknown = JSON.parse(await readFile(CHANNELS_FILE, 'utf8'));
const channels = parseChannels(raw);
const copied: string[] = [];
const failed: string[] = [];
for (const channel of channels) {
  if (!channel.logo?.startsWith('https://')) continue;
  try {
    channel.logo = await copy(channel.id, channel.logo);
    copied.push(channel.name);
  } catch (error) {
    failed.push(`${channel.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
  await pause();
}
if (copied.length > 0) await writeFile(CHANNELS_FILE, `${JSON.stringify(channels, null, 2)}\n`);
console.log(
  [
    `Logos copied into the site: ${copied.length > 0 ? copied.join(', ') : 'none'}.`,
    ...(failed.length > 0 ? ['Still remote:', ...failed.map((line) => `- ${line}`)] : []),
  ].join('\n'),
);
