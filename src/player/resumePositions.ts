/**
 * Where in a live stream's past the viewer was, per channel, so a refresh or a return to
 * the channel picks up there. What is kept is the broadcast moment being watched (a wall
 * clock time), not "N seconds behind": after five minutes away, the same moment is five
 * minutes further behind, and that is where playback resumes.
 */
export interface ResumeEntry {
  /** The broadcast moment being watched, as epoch milliseconds. */
  watchingAt: number;
  savedAt: number;
}

export type ResumePositions = Readonly<Record<string, ResumeEntry>>;

/** Entries older than this are dropped: nobody expects yesterday's place. */
export const RESUME_MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Closer to live than this resumes at live, as watching live does. */
export const RESUME_MIN_BEHIND_SECONDS = 15;
/** Stay this far inside the rewind window, which moves on while the page loads. */
const WINDOW_MARGIN_SECONDS = 10;

function isEntry(value: unknown): value is ResumeEntry {
  if (typeof value !== 'object' || value === null) return false;
  const watchingAt = 'watchingAt' in value ? value.watchingAt : undefined;
  const savedAt = 'savedAt' in value ? value.savedAt : undefined;
  return (
    typeof watchingAt === 'number' &&
    typeof savedAt === 'number' &&
    Number.isFinite(watchingAt) &&
    Number.isFinite(savedAt)
  );
}

/** Reads stored positions, keeping only well-formed, recent entries. */
export function parsePositions(raw: unknown, now: number): ResumePositions {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const kept: Record<string, ResumeEntry> = {};
  for (const [channelId, entry] of Object.entries(raw)) {
    if (isEntry(entry) && now - entry.savedAt < RESUME_MAX_AGE_MS) kept[channelId] = entry;
  }
  return kept;
}

/** Records the place, or forgets it when the viewer is at live. */
export function rememberPosition(
  positions: ResumePositions,
  channelId: string,
  secondsBehindLive: number,
  now: number,
): ResumePositions {
  const others = Object.fromEntries(Object.entries(positions).filter(([id]) => id !== channelId));
  if (secondsBehindLive < RESUME_MIN_BEHIND_SECONDS) return others;
  return { ...others, [channelId]: { watchingAt: now - secondsBehindLive * 1000, savedAt: now } };
}

/**
 * What to do on returning to a channel: seek that far behind live, start at live, or (the
 * moment lies outside the rewind window as known so far) wait: right after a switch the
 * window still describes the previous channel, or the stream has not loaded its past yet.
 */
export type ResumePlan = { kind: 'seek'; seconds: number } | { kind: 'live' } | { kind: 'outside' };

export function resumePlan(
  entry: ResumeEntry | undefined,
  now: number,
  windowSeconds: number,
): ResumePlan {
  if (!entry) return { kind: 'live' };
  const behind = (now - entry.watchingAt) / 1000;
  if (behind < RESUME_MIN_BEHIND_SECONDS) return { kind: 'live' };
  if (behind > windowSeconds - WINDOW_MARGIN_SECONDS) return { kind: 'outside' };
  return { kind: 'seek', seconds: behind };
}
