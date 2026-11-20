import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { LiveWindow } from './useHlsPlayer';

/** Streams with a shorter seekable window than this are treated as live-only. */
const MIN_REWIND_WINDOW_SECONDS = 60;
/** Being this close to the live edge still counts as watching live. */
const LIVE_TOLERANCE_SECONDS = 15;
const POLL_INTERVAL_MS = 1000;

interface DvrState {
  canRewind: boolean;
  secondsBehindLive: number;
  /** How far back the stream allows seeking, measured from the live edge. */
  windowSeconds: number;
}

const INITIAL_STATE: DvrState = { canRewind: false, secondsBehindLive: 0, windowSeconds: 0 };

function isSameState(a: DvrState, b: DvrState) {
  return (
    a.canRewind === b.canRewind &&
    a.secondsBehindLive === b.secondsBehindLive &&
    a.windowSeconds === b.windowSeconds
  );
}

/**
 * Rewind ("DVR") support for live streams whose playlist keeps past segments.
 * Reports whether rewinding is possible and how far behind live playback is,
 * and exposes relative seeking plus a jump back to the live edge.
 */
export function useDvr(
  videoRef: RefObject<HTMLVideoElement | null>,
  getLiveWindow: () => LiveWindow | null,
) {
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    const update = () => {
      const video = videoRef.current;
      const liveWindow = getLiveWindow();
      const next: DvrState =
        video && liveWindow
          ? {
              canRewind: liveWindow.end - liveWindow.start >= MIN_REWIND_WINDOW_SECONDS,
              secondsBehindLive: Math.max(0, Math.round(liveWindow.end - video.currentTime)),
              windowSeconds: Math.floor(liveWindow.end - liveWindow.start),
            }
          : INITIAL_STATE;
      setState((current) => (isSameState(current, next) ? current : next));
    };

    const interval = setInterval(update, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [videoRef, getLiveWindow]);

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      const liveWindow = getLiveWindow();
      if (!video || !liveWindow) return;
      const target = video.currentTime + deltaSeconds;
      video.currentTime = Math.min(liveWindow.end, Math.max(liveWindow.start, target));
    },
    [videoRef, getLiveWindow],
  );

  /** Moves to a point `seconds` behind the live edge, as a timeline does. */
  const seekBehind = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      const liveWindow = getLiveWindow();
      if (!video || !liveWindow) return;
      const target = liveWindow.end - seconds;
      video.currentTime = Math.min(liveWindow.end, Math.max(liveWindow.start, target));
      setState((current) => ({ ...current, secondsBehindLive: Math.max(0, Math.round(seconds)) }));
    },
    [videoRef, getLiveWindow],
  );

  const goLive = useCallback(() => {
    const video = videoRef.current;
    const liveWindow = getLiveWindow();
    if (!video || !liveWindow) return;
    video.currentTime = liveWindow.end;
    void video.play().catch(() => undefined);
  }, [videoRef, getLiveWindow]);

  return {
    ...state,
    isLive: state.secondsBehindLive <= LIVE_TOLERANCE_SECONDS,
    seekBy,
    seekBehind,
    goLive,
  };
}
