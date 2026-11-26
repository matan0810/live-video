import { useI18n } from '../i18n/context';
import { formatDuration } from './formatDuration';
import styles from './PlayerControls.module.css';

interface LiveButtonProps {
  isLive: boolean;
  secondsBehindLive: number;
  onGoLive: () => void;
}

/** "● Live" at the live edge; "● Back to live −1:23" behind it, which returns there. */
export function LiveButton({ isLive, secondsBehindLive, onGoLive }: LiveButtonProps) {
  const { t } = useI18n();
  const label = isLive ? t.watchingLive : t.backToLiveTitle;
  return (
    <button
      type="button"
      className={styles.live}
      data-live={isLive}
      onClick={onGoLive}
      // Enabled whenever behind, even on a channel without a timeline: there must always
      // be a way back to live.
      disabled={isLive}
      title={label}
      aria-label={label}
    >
      <span className={styles.dot} aria-hidden="true" />
      {isLive ? (
        t.live
      ) : (
        <>
          <span className={styles.liveText}>{t.backToLive} </span>
          <bdi>−{formatDuration(secondsBehindLive)}</bdi>
        </>
      )}
    </button>
  );
}
