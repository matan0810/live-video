import { formatDuration } from './formatDuration';
import styles from './DvrControls.module.css';

const SEEK_STEPS_SECONDS = [-60, -10, 10] as const;

interface DvrControlsProps {
  isLive: boolean;
  secondsBehindLive: number;
  windowSeconds: number;
  onSeekBy: (deltaSeconds: number) => void;
  onGoLive: () => void;
}

function stepLabel(deltaSeconds: number) {
  const amount = Math.abs(deltaSeconds);
  return deltaSeconds < 0 ? `${amount} שניות אחורה` : `${amount} שניות קדימה`;
}

export function DvrControls({
  isLive,
  secondsBehindLive,
  windowSeconds,
  onSeekBy,
  onGoLive,
}: DvrControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="חזרה לאחור בשידור">
      {SEEK_STEPS_SECONDS.map((step) => (
        <button
          key={step}
          type="button"
          className={styles.step}
          onClick={() => onSeekBy(step)}
          disabled={step > 0 ? isLive : secondsBehindLive >= windowSeconds}
          aria-label={stepLabel(step)}
          title={stepLabel(step)}
        >
          <bdi>{step > 0 ? `+${step}` : `−${Math.abs(step)}`}</bdi>
        </button>
      ))}
      <button
        type="button"
        className={styles.live}
        data-live={isLive}
        onClick={onGoLive}
        disabled={isLive}
        title={isLive ? 'צופים בשידור החי' : 'חזרה לשידור החי'}
      >
        <span className={styles.dot} aria-hidden="true" />
        {isLive ? (
          'חי'
        ) : (
          <>
            חזרה לחי <bdi className={styles.behind}>−{formatDuration(secondsBehindLive)}</bdi>
          </>
        )}
      </button>
    </div>
  );
}
