import { Container, createPlayer } from '@videojs/react';
import { I18nProvider } from '@videojs/react/i18n';
import { Video, videoFeatures } from '@videojs/react/video';
import { useEffect, useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import type { Channel } from '../channels';
import { useAutoHide } from '../hooks/useAutoHide';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { displayName } from '../channels/displayName';
import { useI18n } from '../i18n/context';
import { UNSUPPORTED_FORMAT } from './codecSupport';
import { PlayerControls } from './PlayerControls';
import { PlayerGestures } from './PlayerGestures';
import { PlayerStatusOverlay } from './PlayerStatusOverlay';
import { SkipIndicator } from './SkipIndicator';
import { useDvr } from './useDvr';
import { useFullscreen } from './useFullscreen';
import { useHlsPlayer, type PlayerStatus } from './useHlsPlayer';
import { useMediaSession } from './useMediaSession';
import { usePlayerControls } from './usePlayerControls';
import styles from './Player.module.css';

const AUTO_RETRY_DELAY_MS = 15_000;
const KEYBOARD_SEEK_SECONDS = 10;
/** Video.js supplies the controls' state, auto-hiding, gestures and labels; playback stays ours. */
const { Player: MediaPlayer } = createPlayer({ features: videoFeatures });
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

  // A channel kept on the list without a working link has nothing to retry.
  const hasNoLink = channel.sources.length === 0;
  const isUnsupportedFormat = errorDetail === UNSUPPORTED_FORMAT;

  useEffect(() => {
    // Nothing changes by retrying a channel with no link or one this browser cannot play.
    if (status !== 'error' || hasNoLink || isUnsupportedFormat) return;
    const timeout = setTimeout(retry, AUTO_RETRY_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [status, retry, hasNoLink, isUnsupportedFormat]);

  return (
    <div className={styles.player}>
      <MediaPlayer>
        {/* Video.js's own labels (play, mute, volume) follow the site's language. */}
        <I18nProvider locale={language}>
          <Container
            ref={frameRef}
            className={styles.frame}
            data-idle={isOverlayShown && !overlayVisibility.isVisible}
            onPointerMove={handlePointerMove}
            onPointerDown={reveal}
          >
            <Video ref={videoRef} className={styles.video} playsInline />
            <SkipIndicator videoRef={videoRef} />

            <PlayerStatusOverlay
              status={status}
              name={name}
              hasNoLink={hasNoLink}
              isUnsupportedFormat={isUnsupportedFormat}
              errorDetail={errorDetail}
              onRetry={retry}
            />

            {isOverlayShown && (
              <div
                className={styles.channelOverlay}
                data-visible={overlayVisibility.isVisible}
                onPointerEnter={() => overlayVisibility.hold(true)}
                onPointerLeave={() => overlayVisibility.hold(false)}
                data-interactive
              >
                {overlay}
              </div>
            )}

            {status === 'playing' && isAutoMuted && (
              <button type="button" className={styles.unmute} onClick={unmute}>
                {t.autoMuted}
              </button>
            )}

            {status !== 'error' && (
              <PlayerControls
                dvr={dvr}
                isFullscreen={fullscreen.isFullscreen}
                onToggleFullscreen={fullscreen.toggle}
                onTogglePictureInPicture={controls.togglePictureInPicture}
                onStep={onStep}
              />
            )}

            <PlayerGestures canSkip={dvr.canRewind} />
          </Container>
        </I18nProvider>
      </MediaPlayer>

      <div className={styles.bar}>
        <h2 className={styles.title}>
          <bdi>{name}</bdi>
        </h2>
        <div className={styles.barEnd}>{actions}</div>
      </div>
    </div>
  );
}
