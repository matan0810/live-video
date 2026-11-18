import { useI18n } from '../i18n/context';
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

export function DvrControls({
  isLive,
  secondsBehindLive,
  windowSeconds,
  onSeekBy,
  onGoLive,
}: DvrControlsProps) {
  const { t } = useI18n();
  const stepLabel = (delta: number) =>
    delta < 0 ? t.seekBack(Math.abs(delta)) : t.seekForward(delta);
  return (
    <div className={styles.controls} role="group" aria-label={t.rewindGroup}>
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
        title={isLive ? t.watchingLive : t.backToLiveTitle}
      >
        <span className={styles.dot} aria-hidden="true" />
        {isLive ? (
          t.live
        ) : (
          <>
            {t.backToLive} <bdi className={styles.behind}>−{formatDuration(secondsBehindLive)}</bdi>
          </>
        )}
      </button>
    </div>
  );
}
