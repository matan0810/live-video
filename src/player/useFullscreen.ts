import { useCallback, useEffect, useState, type RefObject } from 'react';

/** iPhone Safari cannot make an element full screen, only a video, through this API. */
interface IosVideoElement {
  webkitEnterFullscreen?: () => void;
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
    const update = () => setIsFullscreen(document.fullscreenElement === frameRef.current);
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
