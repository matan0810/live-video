import { useEffect, type RefObject } from 'react';

/**
 * Opens picture in picture when the viewer leaves the site while a picture plays, as
 * YouTube does: Chrome does it on switching tab (once the viewer allows it, through the
 * media session's "enterpictureinpicture" action); Safari through the video's
 * `autopictureinpicture` attribute; Android Chrome by itself from full screen. Radio has no
 * picture, so it only keeps playing.
 */
export function useAutoPictureInPicture(
  videoRef: RefObject<HTMLVideoElement | null>,
  isEnabled: boolean,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isEnabled || !document.pictureInPictureEnabled) return;
    video.setAttribute('autopictureinpicture', '');
    const session = 'mediaSession' in navigator ? navigator.mediaSession : null;
    const enter = () => {
      if (document.pictureInPictureElement !== video) {
        video.requestPictureInPicture().catch(() => undefined);
      }
    };
    try {
      session?.setActionHandler('enterpictureinpicture', enter);
    } catch {
      // Browsers without automatic picture in picture refuse the action; nothing to do.
    }
    return () => {
      video.removeAttribute('autopictureinpicture');
      try {
        session?.setActionHandler('enterpictureinpicture', null);
      } catch {
        // As above.
      }
    };
  }, [videoRef, isEnabled]);
}
