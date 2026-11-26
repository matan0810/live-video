import { useMemo } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const KEYBOARD_SEEK_SECONDS = 10;

interface PlayerKeys {
  toggleFullscreen: () => void;
  toggleMute: () => void;
  togglePlay: () => void;
  /** Null for radio: there is no picture to put in picture in picture. */
  togglePictureInPicture: (() => void) | null;
  /** Null where rewind is not offered. */
  seekBy: ((seconds: number) => void) | null;
}

/** The player's keys: Space, M, F, P, and ← / → 10 seconds where rewind is offered. */
export function usePlayerKeys({
  toggleFullscreen,
  toggleMute,
  togglePlay,
  togglePictureInPicture,
  seekBy,
}: PlayerKeys) {
  useKeyboardShortcuts(
    useMemo(
      () => ({
        KeyF: toggleFullscreen,
        KeyM: toggleMute,
        Space: togglePlay,
        ...(togglePictureInPicture && { KeyP: togglePictureInPicture }),
        // Elsewhere the arrows would leave the viewer behind live with no timeline back.
        ...(seekBy && {
          ArrowLeft: () => seekBy(-KEYBOARD_SEEK_SECONDS),
          ArrowRight: () => seekBy(KEYBOARD_SEEK_SECONDS),
        }),
      }),
      [toggleFullscreen, toggleMute, togglePlay, togglePictureInPicture, seekBy],
    ),
  );
}
