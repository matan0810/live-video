/**
 * Copies the channel list saved in the admin area (the Worker's KV) into the site's code,
 * so the code stays a full, versioned record and becomes the fallback for the next release.
 *
 * Usage: API_URL=https://… node scripts/sync-channels.ts
 * Prints a Markdown summary. Leaves channels.json untouched when no list was saved.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { isSavedListCurrent, isVersion } from '../shared/channels/listVersion.ts';
import { parseChannels } from '../shared/channels/parseChannels.ts';
import type { CatalogChannel } from '../shared/channels/types.ts';

const CHANNELS_FILE = new URL('../src/channels/channels.json', import.meta.url);
const PACKAGE_FILE = new URL('../package.json', import.meta.url);
const TIMEOUT_MS = 15_000;

function summarize(before: readonly CatalogChannel[], after: readonly CatalogChannel[]) {
  const oldById = new Map(before.map((channel) => [channel.id, JSON.stringify(channel)]));
  const newIds = new Set(after.map((channel) => channel.id));
  const added = after.filter((channel) => !oldById.has(channel.id)).map((c) => c.name);
  const removed = before.filter((channel) => !newIds.has(channel.id)).map((c) => c.name);
  const changed = after
    .filter((channel) => {
      const old = oldById.get(channel.id);
      return old !== undefined && old !== JSON.stringify(channel);
    })
    .map((c) => c.name);
  const line = (title: string, names: string[]) =>
    names.length > 0 ? `- ${title}: ${names.join(', ')}` : null;
  return [
    `${after.length} channels in the saved list.`,
    line('Added', added),
    line('Removed', removed),
    line('Changed', changed),
  ]
    .filter((text) => text !== null)
    .join('\n');
}

async function main() {
  const apiUrl = process.env.API_URL?.replace(/\/+$/, '');
  if (!apiUrl?.startsWith('https://'))
    throw new Error('API_URL must be set to the https Worker URL');

  const response = await fetch(`${apiUrl}/channels`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`The Worker answered HTTP ${response.status}`);
  const body: unknown = await response.json();
  const saved =
    typeof body === 'object' && body !== null && 'channels' in body ? body.channels : undefined;
  if (saved === undefined) throw new Error('The Worker answered without a channel list');
  if (saved === null) {
    console.log('No list was saved in the admin area yet; the code is left as it is.');
    return;
  }
  // A list saved on an older release than the code is not newer than the code: copying it
  // would undo channel changes made in code since. Only saves on this version or later count.
  const appVersion =
    typeof body === 'object' && body !== null && 'appVersion' in body && isVersion(body.appVersion)
      ? body.appVersion
      : null;
  const { version } = JSON.parse(await readFile(PACKAGE_FILE, 'utf8')) as { version: string };
  if (!isSavedListCurrent(appVersion, version)) {
    console.log(
      `The saved list predates version ${version} (saved on ${appVersion ?? 'an unversioned site'}); the code is left as it is.`,
    );
    return;
  }

  const channels = parseChannels(saved);
  const before = parseChannels(JSON.parse(await readFile(CHANNELS_FILE, 'utf8')));
  await writeFile(CHANNELS_FILE, `${JSON.stringify(channels, null, 2)}\n`);
  console.log(summarize(before, channels));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
