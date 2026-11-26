import { useEffect, useRef, type PointerEvent } from 'react';
import { useAutoHide } from '../hooks/useAutoHide';

const OVERLAY_HIDE_DELAY_MS = 2000;
/** The channel bar opens only when the pointer comes near the top of the video. */
const STRIP_ZONE_SHARE = 0.3;

/**
 * When the channel bar over the video shows: on a real pointer movement in the top of the
 * video, and briefly on every channel switch, like a TV; it hides after a moment.
 */
export function useStripReveal(channelKey: string) {
  const visibility = useAutoHide(OVERLAY_HIDE_DELAY_MS);
  const { reveal } = visibility;
  const lastPointer = useRef({ x: -1, y: -1 });

  // Browsers also fire pointer moves when the page changes under a resting cursor, which
  // would keep the channel bar up forever. Only a real movement reveals it, and only over
  // the top of the video, so moving over the picture does not cover it.
  const handlePointerMove = (event: PointerEvent) => {
    const { clientX: x, clientY: y } = event;
    if (x === lastPointer.current.x && y === lastPointer.current.y) return;
    lastPointer.current = { x, y };
    const frame = event.currentTarget.getBoundingClientRect();
    if (y - frame.top <= frame.height * STRIP_ZONE_SHARE) reveal();
  };

  useEffect(() => {
    reveal();
  }, [channelKey, reveal]);

  return { visibility, handlePointerMove };
}
