import { useEffect, useMemo, type ReactNode } from 'react';
import type { Channel } from '../channels';
import { IconButton } from '../components/IconButton';
import { FullscreenIcon, PictureInPictureIcon } from '../components/icons';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { DvrControls } from './DvrControls';
import { useDvr } from './useDvr';
import { useHlsPlayer, type PlayerStatus } from './useHlsPlayer';
import styles from './Player.module.css';

const AUTO_RETRY_DELAY_MS = 15_000;
const KEYBOARD_SEEK_SECONDS = 10;
const CAN_PICTURE_IN_PICTURE = document.pictureInPictureEnabled;

/** Settles a browser media request that may be refused (e.g. without a user gesture). */
function ignoreRejection(request: Promise<unknown>) {
  request.catch(() => undefined);
}

interface PlayerProps {
  channel: Channel;
  onStatusChange?: (channelId: string, status: PlayerStatus) => void;
  /** Extra buttons rendered at the end of the bar under the video. */
  actions?: ReactNode;
}

export function Player({ channel, onStatusChange, actions }: PlayerProps) {
  const { videoRef, status, errorDetail, retry, isAutoMuted, unmute, getLiveWindow } = useHlsPlayer(
    channel.sources,
  );
  const dvr = useDvr(videoRef, getLiveWindow);

  const { seekBy } = dvr;

  const controls = useMemo(() => {
    const toggleFullscreen = () => {
      const video = videoRef.current;
      if (!video) return;
      ignoreRejection(
        document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen(),
      );
    };
    const togglePictureInPicture = () => {
      const video = videoRef.current;
      if (!video) return;
      ignoreRejection(
        document.pictureInPictureElement
          ? document.exitPictureInPicture()
          : video.requestPictureInPicture(),
      );
    };
    const toggleMute = () => {
      if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
    };
    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) ignoreRejection(video.play());
      else video.pause();
    };
    return { toggleFullscreen, togglePictureInPicture, toggleMute, togglePlay };
  }, [videoRef]);

  useKeyboardShortcuts(
    useMemo(
      () => ({
        KeyF: controls.toggleFullscreen,
        KeyM: controls.toggleMute,
        KeyP: controls.togglePictureInPicture,
        Space: controls.togglePlay,
        ArrowLeft: () => seekBy(-KEYBOARD_SEEK_SECONDS),
        ArrowRight: () => seekBy(KEYBOARD_SEEK_SECONDS),
      }),
      [controls, seekBy],
    ),
  );

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
            {errorDetail && (
              <span className={styles.errorDetail} dir="ltr">
                {errorDetail}
              </span>
            )}
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
          {CAN_PICTURE_IN_PICTURE && (
            <IconButton label="תמונה בתוך תמונה (P)" onClick={controls.togglePictureInPicture}>
              <PictureInPictureIcon />
            </IconButton>
          )}
          <IconButton label="מסך מלא (F)" onClick={controls.toggleFullscreen}>
            <FullscreenIcon />
          </IconButton>
          {actions}
        </div>
      </div>
    </div>
  );
}
