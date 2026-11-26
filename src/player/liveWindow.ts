/** The part of a live stream the viewer can move through, in the video's own seconds. */
export interface LiveWindow {
  start: number;
  end: number;
}

/**
 * The rewind window of a stream the browser plays by itself (Safari's own HLS, or a radio
 * station's plain audio stream), from what the element reports. A plain audio stream keeps
 * no past to return to, and some browsers report its range as endless (Android Chrome:
 * from 0 to Infinity), so it never has a window; nor does any range that is not finite.
 */
export function nativeLiveWindow(
  duration: number,
  ranges: readonly (readonly [number, number])[],
  isPlainAudio: boolean,
): LiveWindow | null {
  if (isPlainAudio || Number.isFinite(duration)) return null;
  const first = ranges[0];
  const last = ranges[ranges.length - 1];
  if (!first || !last) return null;
  const window = { start: first[0], end: last[1] };
  return Number.isFinite(window.start) && Number.isFinite(window.end) && window.end > window.start
    ? window
    : null;
}
