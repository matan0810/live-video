/** What an HLS playlist says about itself, for showing a link's quality before using it. */
export interface PlaylistInfo {
  /** Height of the best variant (e.g. 1080), or null for a single-quality playlist. */
  maxHeight: number | null;
  /** Number of quality variants; 0 for a media playlist (a single quality). */
  variants: number;
  /** Whether it is a live stream (no end marker), as opposed to a recording. */
  isLive: boolean;
}

export function readPlaylistInfo(playlist: string): PlaylistInfo {
  const heights = [...playlist.matchAll(/RESOLUTION=\d+x(\d+)/g)].map((match) => Number(match[1]));
  const variants = (playlist.match(/#EXT-X-STREAM-INF/g) ?? []).length;
  return {
    maxHeight: heights.length > 0 ? Math.max(...heights) : null,
    variants,
    // A master playlist never has an end marker; only a finished recording does.
    isLive: !playlist.includes('#EXT-X-ENDLIST'),
  };
}
