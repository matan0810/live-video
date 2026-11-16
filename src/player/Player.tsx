import { useEffect, type ReactNode } from 'react';
import type { Channel } from '../channels';
import { DvrControls } from './DvrControls';
import { useDvr } from './useDvr';
import { useHlsPlayer, type PlayerStatus } from './useHlsPlayer';
import styles from './Player.module.css';

const AUTO_RETRY_DELAY_MS = 15_000;

interface PlayerProps {
  channel: Channel;
  onStatusChange?: (channelId: string, status: PlayerStatus) => void;
  /** Extra buttons rendered at the end of the bar under the video. */
  actions?: ReactNode;
}

export function Player({ channel, onStatusChange, actions }: PlayerProps) {
  const { videoRef, status, retry, isAutoMuted, unmute, getLiveWindow } = useHlsPlayer(
    channel.sources,
  );
  const dvr = useDvr(videoRef, getLiveWindow);

  useEffect(() => {
    onStatusChange?.(channel.id, status);
  }, [channel.id, status, onStatusChange]);

  useEffect(() => {
    if (status !== 'error') return;
    const timeout = setTimeout(retry, AUTO_RETRY_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [status, retry]);

  return (
    <div className={styles.player}>
      <div className={styles.frame}>
        <video ref={videoRef} className={styles.video} controls playsInline />

        {status === 'loading' && (
          <div className={styles.overlay} data-passive="true" role="status">
            <span className={styles.spinner} aria-hidden="true" />
            <span>טוען את {channel.name}…</span>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.overlay} role="alert">
            <strong className={styles.errorTitle}>{channel.name} לא זמין כרגע</strong>
            <span className={styles.errorHint}>מנסה שוב אוטומטית בעוד כמה שניות</span>
            <button type="button" className={styles.primaryButton} onClick={retry}>
              נסה שוב עכשיו
            </button>
          </div>
        )}

        {status === 'playing' && isAutoMuted && (
          <button type="button" className={styles.unmute} onClick={unmute}>
            הקול מושתק · לחצו להפעלה
          </button>
        )}
      </div>

      <div className={styles.bar}>
        <h2 className={styles.title}>{channel.name}</h2>
        <div className={styles.barEnd}>
          {status === 'playing' && dvr.canRewind && (
            <DvrControls
              isLive={dvr.isLive}
              secondsBehindLive={dvr.secondsBehindLive}
              windowSeconds={dvr.windowSeconds}
              onSeekBy={dvr.seekBy}
              onGoLive={dvr.goLive}
            />
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
