import { useMemo, type RefObject } from 'react';

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
      if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
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
