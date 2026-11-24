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

  const start = useCallback((minutes: SleepMinutes | null) => {
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
    }, endsAt - Date.now());
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [endsAt, videoRef]);

  return { minutesLeft: left, start };
}
