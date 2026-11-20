import { useCallback, useEffect, useState, type RefObject } from 'react';

/** iPhone Safari cannot make an element full screen, only a video, through this API. */
interface IosVideoElement {
  webkitEnterFullscreen?: () => void;
}

/** Locking orientation is missing from TypeScript's types; Chrome on Android supports it. */
interface LockableOrientation {
  lock?: (orientation: 'landscape') => Promise<void>;
  unlock?: () => void;
}

const TOUCH_QUERY = '(pointer: coarse)';

/** On a phone, full screen turns the picture sideways, as video apps do. */
function setLandscape(isFullscreen: boolean) {
  if (!window.matchMedia(TOUCH_QUERY).matches) return;
  const orientation: (ScreenOrientation & LockableOrientation) | undefined = screen.orientation;
  if (isFullscreen) orientation?.lock?.('landscape').catch(() => undefined);
  else orientation?.unlock?.();
}

/**
 * Full screen for the player's frame rather than the bare <video>, so the site's own
 * overlays (such as the channel bar) stay visible in full screen.
 */
export function useFullscreen(
  frameRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const update = () => {
      const isNow = document.fullscreenElement === frameRef.current;
      setIsFullscreen(isNow);
      setLandscape(isNow);
    };
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [frameRef]);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
      return;
    }
    const frame = frameRef.current;
    if (frame && typeof frame.requestFullscreen === 'function') {
      frame.requestFullscreen().catch(() => undefined);
      return;
    }
    const video: (HTMLVideoElement & IosVideoElement) | null = videoRef.current;
    video?.webkitEnterFullscreen?.();
  }, [frameRef, videoRef]);

  return { isFullscreen, toggle };
}
