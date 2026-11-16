/** A stream listed by the community-maintained iptv-org directory. */
export interface DirectoryStream {
  channel: string;
  title: string;
  quality: string;
  url: string;
}

const DIRECTORY_URL = 'https://iptv-org.github.io/api/streams.json';
export const MAX_RESULTS = 30;

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

/** Reads the directory defensively: its format is outside this project's control. */
export function parseDirectory(data: unknown): DirectoryStream[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { channel, title, quality, url } = entry as Record<string, unknown>;
    if (typeof url !== 'string' || !url.startsWith('https://')) return [];
    return [{ channel: text(channel), title: text(title), quality: text(quality), url }];
  });
}

export function searchDirectory(streams: readonly DirectoryStream[], query: string) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [];
  return streams
    .filter((stream) => `${stream.channel} ${stream.title}`.toLowerCase().includes(needle))
    .slice(0, MAX_RESULTS);
}

export async function fetchDirectory(): Promise<DirectoryStream[]> {
  const response = await fetch(DIRECTORY_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseDirectory(await response.json());
}
