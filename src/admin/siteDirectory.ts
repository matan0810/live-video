import { fetchDirectory, type DirectoryStream } from './streamDirectory';
import { isRecord } from '../../shared/isRecord';

/** A channel in the iptv-org directory, with the website it belongs to. */
export interface DirectoryChannel {
  id: string;
  name: string;
  website: string;
}

const CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';

/** Reads the channel list defensively, keeping only channels that name a website. */
export function parseDirectoryChannels(data: unknown): DirectoryChannel[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry: unknown) => {
    if (!isRecord(entry)) return [];
    const { id, name, website } = entry;
    if (typeof id !== 'string' || typeof website !== 'string' || !website) return [];
    return [{ id, name: typeof name === 'string' ? name : id, website }];
  });
}

/** "www.kan.org.il" and "kan.org.il" are the same site; anything else is compared exactly. */
function siteOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Directory streams of the channels whose website is the same site as `pageUrl`. */
export function streamsForSite(
  pageUrl: string,
  channels: readonly DirectoryChannel[],
  streams: readonly DirectoryStream[],
): DirectoryStream[] {
  const site = siteOf(pageUrl);
  if (!site) return [];
  const ids = new Set(
    channels.filter((channel) => siteOf(channel.website) === site).map((c) => c.id),
  );
  return streams.filter((stream) => ids.has(stream.channel));
}

let loading: Promise<[DirectoryChannel[], DirectoryStream[]]> | null = null;

/** Downloads the directory once per visit (it is several megabytes) and reuses it. */
function loadDirectory() {
  loading ??= Promise.all([
    fetch(CHANNELS_URL).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parseDirectoryChannels(await response.json());
    }),
    fetchDirectory(),
  ]).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** Streams the iptv-org directory lists for the site of `pageUrl`. */
export async function findStreamsForSite(pageUrl: string): Promise<DirectoryStream[]> {
  const [channels, streams] = await loadDirectory();
  return streamsForSite(pageUrl, channels, streams);
}
