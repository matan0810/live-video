/** A skip shown on screen, YouTube style: which way, and how far in total. */
export interface SkipFeedback {
  direction: 'back' | 'forward';
  seconds: number;
}

/** Jumps outside this range are not skips (a drag on the timeline, or the jump to live). */
const MIN_SKIP_SECONDS = 3;
const MAX_SKIP_SECONDS = 65;
/** Skips this close together add up ("20 seconds" after two double-taps). */
const COMBINE_MS = 1200;
/** Skips are shown in steps of five seconds, since playback moves on while seeking. */
const ROUND_TO = 5;

/**
 * Turns a seek into the feedback to show, or null when it is not a skip. `previous` is the
 * feedback still on screen, so quick repeated skips in one direction add up.
 */
export function skipFeedback(
  delta: number,
  previous: (SkipFeedback & { at: number }) | null,
  now: number,
): (SkipFeedback & { at: number }) | null {
  const distance = Math.abs(delta);
  if (distance < MIN_SKIP_SECONDS || distance > MAX_SKIP_SECONDS) return null;
  const direction = delta < 0 ? 'back' : 'forward';
  const seconds = Math.max(ROUND_TO, Math.round(distance / ROUND_TO) * ROUND_TO);
  const isCombined =
    previous !== null && previous.direction === direction && now - previous.at < COMBINE_MS;
  return { direction, seconds: isCombined ? previous.seconds + seconds : seconds, at: now };
}
