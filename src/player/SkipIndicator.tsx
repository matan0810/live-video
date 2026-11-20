import { useEffect, useState, type RefObject } from 'react';
import { useI18n } from '../i18n/context';
import { skipFeedback, type SkipFeedback } from './seekFeedback';
import styles from './SkipIndicator.module.css';

const SHOW_MS = 700;

/**
 * Shows a skip on its side of the video, YouTube style. It watches the video itself, so
 * every way of skipping (double tap, buttons, arrow keys) is covered alike.
 */
export function SkipIndicator({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<(SkipFeedback & { at: number }) | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let lastTime = video.currentTime;
    let current: (SkipFeedback & { at: number }) | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const handleTimeUpdate = () => {
      if (!video.seeking) lastTime = video.currentTime;
    };
    const handleSeeking = () => {
      const next = skipFeedback(video.currentTime - lastTime, current, Date.now());
      lastTime = video.currentTime;
      if (!next) return;
      current = next;
      setFeedback(next);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        current = null;
        setFeedback(null);
      }, SHOW_MS);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    return () => {
      clearTimeout(hideTimer);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [videoRef]);

  if (!feedback) return null;
  return (
    <div className={styles.indicator} data-direction={feedback.direction} aria-hidden="true">
      <span className={styles.bubble}>
        <span className={styles.arrows}>{feedback.direction === 'back' ? '◀◀' : '▶▶'}</span>
        <span>{t.skipSeconds(feedback.seconds)}</span>
      </span>
    </div>
  );
}
