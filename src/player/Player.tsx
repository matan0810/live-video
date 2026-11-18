import { useEffect, useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import type { Channel } from '../channels';
import { IconButton } from '../components/IconButton';
import { FullscreenIcon, PictureInPictureIcon } from '../components/icons';
import { useAutoHide } from '../hooks/useAutoHide';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { DvrControls } from './DvrControls';
import { useDvr } from './useDvr';
import { useFullscreen } from './useFullscreen';
import { useHlsPlayer, type PlayerStatus } from './useHlsPlayer';
import { usePlayerControls } from './usePlayerControls';
import styles from './Player.module.css';

const AUTO_RETRY_DELAY_MS = 15_000;
const KEYBOARD_SEEK_SECONDS = 10;
const CAN_PICTURE_IN_PICTURE = document.pictureInPictureEnabled;
const OVERLAY_HIDE_DELAY_MS = 3000;

interface PlayerProps {
  channel: Channel;
  onStatusChange?: (channelId: string, status: PlayerStatus) => void;
  /** Extra buttons rendered at the end of the bar under the video. */
  actions?: ReactNode;
  /** Shown over the top of the video in full screen, and when `isOverlayEnabled`. */
  overlay?: ReactNode;
  isOverlayEnabled?: boolean;
}

export function Player({
  channel,
  onStatusChange,
  actions,
  overlay,
  isOverlayEnabled = false,
}: PlayerProps) {
  const { videoRef, status, errorDetail, retry, isAutoMuted, unmute, getLiveWindow } = useHlsPlayer(
    channel.sources,
  );
  const dvr = useDvr(videoRef, getLiveWindow);

  const { seekBy } = dvr;
  const frameRef = useRef<HTMLDivElement>(null);
  const controls = usePlayerControls(videoRef);
  const fullscreen = useFullscreen(frameRef, videoRef);
  const overlayVisibility = useAutoHide(OVERLAY_HIDE_DELAY_MS);
  const { reveal } = overlayVisibility;
  const isOverlayShown = Boolean(overlay) && (fullscreen.isFullscreen || isOverlayEnabled);
  const lastPointer = useRef({ x: -1, y: -1 });

  // Browsers also fire pointer moves when the page changes under a resting cursor, which
  // would keep the channel bar up forever. Only a real movement reveals it.
  const handlePointerMove = (event: PointerEvent) => {
    const { clientX: x, clientY: y } = event;
    if (x === lastPointer.current.x && y === lastPointer.current.y) return;
    lastPointer.current = { x, y };
    reveal();
  };

  useKeyboardShortcuts(
    useMemo(
      () => ({
        KeyF: fullscreen.toggle,
        KeyM: controls.toggleMute,
        KeyP: controls.togglePictureInPicture,
        Space: controls.togglePlay,
        ArrowLeft: () => seekBy(-KEYBOARD_SEEK_SECONDS),
        ArrowRight: () => seekBy(KEYBOARD_SEEK_SECONDS),
      }),
      [controls, fullscreen.toggle, seekBy],
    ),
  );

  // Switching channel briefly shows the channel bar, like a TV does.
  useEffect(() => {
    reveal();
  }, [channel.id, reveal]);

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
      <div
        ref={frameRef}
        className={styles.frame}
        data-idle={isOverlayShown && !overlayVisibility.isVisible}
        onPointerMove={handlePointerMove}
        onPointerDown={reveal}
        onDoubleClick={fullscreen.toggle}
      >
        {/* The browser's own full-screen button would hide the channel bar; ours keeps it. */}
        <video
          ref={videoRef}
          className={styles.video}
          controls
          controlsList="nofullscreen"
          playsInline
        />

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

        {isOverlayShown && (
          <div
            className={styles.channelOverlay}
            data-visible={overlayVisibility.isVisible}
            onPointerEnter={() => overlayVisibility.hold(true)}
            onPointerLeave={() => overlayVisibility.hold(false)}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            {overlay}
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
          <IconButton label="מסך מלא (F)" onClick={fullscreen.toggle}>
            <FullscreenIcon />
          </IconButton>
          {actions}
        </div>
      </div>
    </div>
  );
}
