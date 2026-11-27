import { useEffect, useRef } from 'react';
import type { PlayerStatus } from './useHlsPlayer';
import {
  parsePositions,
  rememberPosition,
  resumePlan,
  type ResumePositions,
} from './resumePositions';

const STORAGE_KEY = 'live-video:resume';
const SAVE_EVERY_MS = 5000;
/** How long to wait for a channel's real rewind window before giving up and staying live. */
const WINDOW_WAIT_MS = 10_000;

interface DvrView {
  canRewind: boolean;
  secondsBehindLive: number;
  windowSeconds: number;
  seekBehind: (seconds: number) => void;
}

function load(now: number, maxAgeMs: number): ResumePositions {
  try {
    return parsePositions(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'), now, maxAgeMs);
  } catch {
    return {};
  }
}

function save(positions: ResumePositions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Storage full or blocked: resuming is a convenience, playback goes on.
  }
}

/**
 * Brings the viewer back to the moment they were watching on a channel with rewind, after
 * a refresh or a return to the channel (see resumePositions.ts), and keeps that moment up
 * to date while they watch behind live.
 */
export function useResumePosition(
  channelId: string,
  status: PlayerStatus,
  dvr: DvrView,
  /** How old a kept place may be (the viewer's setting); zero turns remembering off. */
  maxAgeMs: number,
) {
  const latest = useRef(dvr);
  useEffect(() => {
    latest.current = dvr;
  }, [dvr]);
  const restoredFor = useRef<string | null>(null);

  const playingSince = useRef<{ channelId: string; at: number } | null>(null);

  // Restore once per channel, once it plays and its rewind window is known. A moment that
  // seems outside the window is waited for a little: the window may still be the previous
  // channel's, or not loaded yet.
  useEffect(() => {
    if (maxAgeMs <= 0 || status !== 'playing' || !dvr.canRewind) return;
    if (restoredFor.current === channelId) return;
    const now = Date.now();
    if (playingSince.current?.channelId !== channelId)
      playingSince.current = { channelId, at: now };
    const plan = resumePlan(load(now, maxAgeMs)[channelId], now, dvr.windowSeconds);
    if (plan.kind === 'outside' && now - playingSince.current.at < WINDOW_WAIT_MS) return;
    restoredFor.current = channelId;
    if (plan.kind === 'seek') dvr.seekBehind(plan.seconds);
  }, [channelId, status, dvr, maxAgeMs]);

  // Keep the moment current while playing, and on leaving the channel or the page.
  useEffect(() => {
    const record = () => {
      const view = latest.current;
      if (maxAgeMs <= 0 || restoredFor.current !== channelId || !view.canRewind) return;
      const now = Date.now();
      save(rememberPosition(load(now, maxAgeMs), channelId, view.secondsBehindLive, now));
    };
    const timer = setInterval(record, SAVE_EVERY_MS);
    window.addEventListener('pagehide', record);
    return () => {
      record();
      // Leaving the channel: the next visit restores again, even if the channel in between
      // had no rewind and so never claimed the mark.
      restoredFor.current = null;
      clearInterval(timer);
      window.removeEventListener('pagehide', record);
    };
  }, [channelId, maxAgeMs]);
}
