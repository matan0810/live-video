import { useEffect, useState, type RefObject } from 'react';
import { speedAfterCatchingUp, type Speed } from './playbackSpeed';

/** The video's speed, back to normal on every channel switch and on catching up with live. */
export function usePlaybackSpeed(
  videoRef: RefObject<HTMLVideoElement | null>,
  isLive: boolean,
  channelKey: string,
) {
  const [speed, setSpeed] = useState<Speed>(1);
  const [speedFor, setSpeedFor] = useState(channelKey);
  // Adjusted during render, so a stale speed is never shown for a moment.
  if (speedFor !== channelKey) {
    setSpeedFor(channelKey);
    setSpeed(1);
  } else if (speedAfterCatchingUp(speed, isLive) !== speed) {
    setSpeed(speedAfterCatchingUp(speed, isLive));
  }

  // The element keeps its rate across sources, so it follows the state on every change.
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.playbackRate !== speed) video.playbackRate = speed;
  }, [videoRef, speed, channelKey]);

  return { speed, setSpeed };
}
