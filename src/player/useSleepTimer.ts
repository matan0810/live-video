import { useCallback, useEffect, useState, type RefObject } from 'react';
import { minutesLeft, type SleepMinutes } from './sleepTimer';

const TICK_MS = 15_000;

/**
 * Pauses the player after the chosen time, for falling asleep to the news. It belongs to
 * the viewer, not the channel: switching channels keeps it running.
 */
export function useSleepTimer(videoRef: RefObject<HTMLVideoElement | null>) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  /** The timer paused the player, and it has not played since: the player says so. */
  const [hasStopped, setHasStopped] = useState(false);

  const start = useCallback((minutes: SleepMinutes | null) => {
    setHasStopped(false);
    if (minutes === null) {
      setEndsAt(null);
      setLeft(null);
      return;
    }
    setEndsAt(Date.now() + minutes * 60_000);
    setLeft(minutes);
  }, []);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = setInterval(() => setLeft(minutesLeft(endsAt, Date.now())), TICK_MS);
    const stop = setTimeout(() => {
      videoRef.current?.pause();
      setEndsAt(null);
      setLeft(null);
      setHasStopped(true);
    }, endsAt - Date.now());
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [endsAt, videoRef]);

  // Playing again (any way: the button, a key, the lock screen) clears the message.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasStopped) return;
    const clear = () => setHasStopped(false);
    video.addEventListener('play', clear);
    return () => video.removeEventListener('play', clear);
  }, [videoRef, hasStopped]);

  return { minutesLeft: left, hasStopped, start };
}
