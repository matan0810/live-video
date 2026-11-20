import { useEffect, type RefObject } from 'react';

interface MediaSessionOptions {
  title: string;
  /** The channel's logo, when it has one; the site's icon is used besides it. */
  logo: string | undefined;
  onStep: (offset: 1 | -1) => void;
}

const APP_ICON = `${import.meta.env.BASE_URL}icon-512.png`;

function absolute(address: string) {
  return new URL(address, window.location.href).href;
}

/**
 * Shows the channel on the phone's lock screen and in the system's media controls, whose
 * previous and next buttons switch channel.
 */
export function useMediaSession(
  videoRef: RefObject<HTMLVideoElement | null>,
  { title, logo, onStep }: MediaSessionOptions,
) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const session = navigator.mediaSession;
    const logoAddress =
      logo && (logo.startsWith('https://') ? logo : `${import.meta.env.BASE_URL}${logo}`);
    session.metadata = new MediaMetadata({
      title,
      artist: 'OnAir',
      artwork: [
        ...(logoAddress ? [{ src: absolute(logoAddress) }] : []),
        { src: absolute(APP_ICON), sizes: '512x512', type: 'image/png' },
      ],
    });

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => void videoRef.current?.play().catch(() => undefined)],
      ['pause', () => videoRef.current?.pause()],
      ['previoustrack', () => onStep(-1)],
      ['nexttrack', () => onStep(1)],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // An action this browser does not support; the others still work.
      }
    }
    return () => {
      session.metadata = null;
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // As above.
        }
      }
    };
  }, [videoRef, title, logo, onStep]);
}
