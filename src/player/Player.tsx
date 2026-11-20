import { useEffect, useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import type { Channel } from '../channels';
import { IconButton } from '../components/IconButton';
import { FullscreenIcon, PictureInPictureIcon } from '../components/icons';
import { useAutoHide } from '../hooks/useAutoHide';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { displayName } from '../channels/displayName';
import { useI18n } from '../i18n/context';
import { DvrControls } from './DvrControls';
import { useDvr } from './useDvr';
import { useFullscreen } from './useFullscreen';
import { useHlsPlayer, type PlayerStatus } from './useHlsPlayer';
import { useMediaSession } from './useMediaSession';
import { usePlayerControls } from './usePlayerControls';
import styles from './Player.module.css';

const AUTO_RETRY_DELAY_MS = 15_000;
const KEYBOARD_SEEK_SECONDS = 10;
const CAN_PICTURE_IN_PICTURE = document.pictureInPictureEnabled;
const OVERLAY_HIDE_DELAY_MS = 3000;
/** The channel bar is for mouse users; on touch screens it is too easy to tap by accident. */
const MOUSE_QUERY = '(hover: hover) and (pointer: fine)';

interface PlayerProps {
  channel: Channel;
  onStatusChange?: (channelId: string, status: PlayerStatus) => void;
  /** Extra buttons rendered at the end of the bar under the video. */
  actions?: ReactNode;
  /** Shown over the top of the video in full screen, and when `isOverlayEnabled`. */
  overlay?: ReactNode;
  isOverlayEnabled?: boolean;
  /** Switches to the next (1) or previous (-1) channel, from the system's media controls. */
  onStep: (offset: 1 | -1) => void;
}

export function Player({
  channel,
  onStatusChange,
  actions,
  overlay,
  isOverlayEnabled = false,
  onStep,
}: PlayerProps) {
  const { videoRef, status, errorDetail, retry, isAutoMuted, unmute, getLiveWindow } = useHlsPlayer(
    channel.sources,
  );
  const dvr = useDvr(videoRef, getLiveWindow);
  const { t, language } = useI18n();
  const name = displayName(channel, language);
  useMediaSession(videoRef, { title: name, logo: channel.logo, onStep });

  const { seekBy } = dvr;
  const frameRef = useRef<HTMLDivElement>(null);
  const controls = usePlayerControls(videoRef);
  const fullscreen = useFullscreen(frameRef, videoRef);
  const overlayVisibility = useAutoHide(OVERLAY_HIDE_DELAY_MS);
  const { reveal } = overlayVisibility;
  const hasMouse = useMediaQuery(MOUSE_QUERY);
  const isOverlayShown =
    hasMouse && Boolean(overlay) && (fullscreen.isFullscreen || isOverlayEnabled);
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
            <span>{t.loading(name)}</span>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.overlay} role="alert">
            <strong className={styles.errorTitle}>{t.channelUnavailable(name)}</strong>
            <span className={styles.errorHint}>{t.retryingSoon}</span>
            {errorDetail && (
              <span className={styles.errorDetail} dir="ltr">
                {errorDetail}
              </span>
            )}
            <button type="button" className={styles.primaryButton} onClick={retry}>
              {t.retryNow}
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
            {t.autoMuted}
          </button>
        )}
      </div>

      <div className={styles.bar}>
        <h2 className={styles.title}>
          <bdi>{name}</bdi>
        </h2>
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
            <IconButton label={t.pictureInPicture} onClick={controls.togglePictureInPicture}>
              <PictureInPictureIcon />
            </IconButton>
          )}
          <IconButton label={t.fullscreen} onClick={fullscreen.toggle}>
            <FullscreenIcon />
          </IconButton>
          {actions}
        </div>
      </div>
    </div>
  );
}
