import { useState, type CSSProperties } from 'react';
import { useI18n } from '../i18n/context';
import { formatDuration } from './formatDuration';
import styles from './PlayerControls.module.css';

interface DvrSliderProps {
  /** How far back the stream allows seeking, from the live edge. */
  windowSeconds: number;
  secondsBehindLive: number;
  onSeekBehind: (seconds: number) => void;
}

/**
 * A timeline over the stream's rewind window, which moves forward as the broadcast goes on
 * (Video.js's own time slider assumes history starts at zero). It seeks once the viewer
 * lets go, not on every step of a drag.
 */
export function DvrSlider({ windowSeconds, secondsBehindLive, onSeekBehind }: DvrSliderProps) {
  const { t } = useI18n();
  const [dragValue, setDragValue] = useState<number | null>(null);
  const value = dragValue ?? Math.max(0, windowSeconds - secondsBehindLive);
  const behind = windowSeconds - value;

  const commit = () => {
    if (dragValue === null) return;
    onSeekBehind(windowSeconds - dragValue);
    setDragValue(null);
  };

  return (
    <div className={styles.timeline}>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={windowSeconds}
        step={1}
        value={value}
        aria-label={t.timeline}
        aria-valuetext={behind < 1 ? t.live : `−${formatDuration(behind)}`}
        style={
          {
            '--fill': `${windowSeconds > 0 ? (value / windowSeconds) * 100 : 100}%`,
          } as CSSProperties
        }
        onChange={(event) => setDragValue(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      {dragValue !== null && (
        <output className={styles.dragTime}>
          {behind < 1 ? t.live : `−${formatDuration(behind)}`}
        </output>
      )}
    </div>
  );
}
