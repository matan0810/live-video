import { Gesture } from '@videojs/react';

const SEEK_GESTURE_SECONDS = 10;

/** Mouse and touch gestures on the video, as in most video apps. */
export function PlayerGestures({ canSkip }: { canSkip: boolean }) {
  return (
    <>
      {/* Click pauses; double-click (or double-tap in the middle) is full screen; on
            touch screens a double tap on either side jumps ten seconds, like most apps. */}
      <Gesture type="tap" pointer="mouse" action="togglePaused" />
      <Gesture type="doubletap" pointer="mouse" action="toggleFullscreen" />
      <Gesture
        type="doubletap"
        pointer="touch"
        region="left"
        action="seekStep"
        value={-SEEK_GESTURE_SECONDS}
        disabled={!canSkip}
      />
      <Gesture
        type="doubletap"
        pointer="touch"
        region="right"
        action="seekStep"
        value={SEEK_GESTURE_SECONDS}
        disabled={!canSkip}
      />
    </>
  );
}
