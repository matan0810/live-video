import { isStreamRequest, MAX_STREAM_LINKS } from '../../shared/streamLinks';

/** A real browser tab, as far as capturing a player's requests needs one. */
export interface CaptureSession {
  /** Opens the page, reporting every request the page (and its frames) makes. */
  open(url: string, onRequest: (url: string) => void): Promise<void>;
  /** Nudges the player into starting: plays any video and clicks where a play button sits. */
  tryPlay(): Promise<void>;
  close(): Promise<void>;
}

export interface CaptureTimings {
  /** How long to wait for the player to start on its own before nudging it. */
  beforePlayMs: number;
  /** The whole budget, page load included. */
  totalMs: number;
  /** Once a link appears, how long to keep listening for its siblings (other qualities). */
  settleMs: number;
  pollMs: number;
}

export const DEFAULT_TIMINGS: CaptureTimings = {
  beforePlayMs: 6_000,
  totalMs: 25_000,
  settleMs: 2_500,
  pollMs: 250,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Opens a page in a real browser and records the HLS playlists its player requests, the
 * way the Network tab of the browser's developer tools would show them. Catches players
 * that fetch the stream address only at run time, which a plain page scan cannot see.
 */
export async function captureStreamRequests(
  startSession: () => Promise<CaptureSession>,
  url: string,
  timings: CaptureTimings = DEFAULT_TIMINGS,
): Promise<string[]> {
  const found = new Set<string>();
  let firstFoundAt: number | null = null;
  const started = Date.now();
  const session = await startSession();

  try {
    await session.open(url, (requested) => {
      if (found.size >= MAX_STREAM_LINKS || !isStreamRequest(requested)) return;
      found.add(requested);
      firstFoundAt ??= Date.now();
    });

    let nudged = false;
    while (Date.now() - started < timings.totalMs) {
      if (firstFoundAt !== null && Date.now() - firstFoundAt >= timings.settleMs) break;
      if (!nudged && found.size === 0 && Date.now() - started >= timings.beforePlayMs) {
        nudged = true;
        await session.tryPlay();
      }
      await sleep(timings.pollMs);
    }
  } finally {
    await session.close();
  }
  return [...found];
}
