import { useMemo, type RefObject } from 'react';
import { rememberSound } from './soundChoice';

/** Settles a browser media request that may be refused (e.g. without a user gesture). */
function ignoreRejection(request: Promise<unknown>) {
  request.catch(() => undefined);
}

export function usePlayerControls(videoRef: RefObject<HTMLVideoElement | null>) {
  return useMemo(() => {
    const togglePictureInPicture = () => {
      const video = videoRef.current;
      if (!video) return;
      ignoreRejection(
        document.pictureInPictureElement
          ? document.exitPictureInPicture()
          : video.requestPictureInPicture(),
      );
    };
    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      // At once, not on the volumechange event: a retry may set up the player before it.
      rememberSound(video);
    };
    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) ignoreRejection(video.play());
      else video.pause();
    };
    return { togglePictureInPicture, toggleMute, togglePlay };
  }, [videoRef]);
}
