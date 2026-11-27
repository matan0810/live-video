import { ChannelLimits } from '../components/ChannelLimits';
import { Container, createPlayer } from '@videojs/react';
import { I18nProvider } from '@videojs/react/i18n';
import { Video, videoFeatures } from '@videojs/react/video';
import { useEffect, useRef, type ReactNode } from 'react';
import type { Channel, ChannelGroup } from '../channels';
import { isRadio } from '../channels/isRadio';
import { isAppleMobile } from '../device';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { displayName } from '../channels/displayName';
import { useI18n } from '../i18n/context';
import { UNSUPPORTED_FORMAT } from './codecSupport';
import { PlayerControls } from './PlayerControls';
import { PlayerGestures } from './PlayerGestures';
import { PlayerStatusOverlay } from './PlayerStatusOverlay';
import { RadioStage } from './RadioStage';
import { SkipIndicator } from './SkipIndicator';
import { useDvr } from './useDvr';
import { useFullscreen } from './useFullscreen';
import { useHlsPlayer, type PlayerStatus } from './useHlsPlayer';
import { useAutoPictureInPicture } from './useAutoPictureInPicture';
import { useLoudnessLevelling } from './useLoudnessLevelling';
import { usePlayerMenu } from './usePlayerMenu';
import { useMediaSession } from './useMediaSession';
import { useResumePosition } from './useResumePosition';
import { usePlayerControls } from './usePlayerControls';
import { usePlayerKeys } from './usePlayerKeys';
import { useRetryFeedback } from './useRetryFeedback';
import { useStripReveal } from './useStripReveal';
import styles from './Player.module.css';

const AUTO_RETRY_DELAY_MS = 15_000;
/** Video.js supplies the controls' state, auto-hiding, gestures and labels; playback stays ours. */
const { Player: MediaPlayer } = createPlayer({ features: videoFeatures });
/** The channel bar is for mouse users; on touch screens it is too easy to tap by accident. */
const MOUSE_QUERY = '(hover: hover) and (pointer: fine)';

interface PlayerProps {
  channel: Channel & { group?: ChannelGroup };
  onStatusChange?: (channelId: string, status: PlayerStatus) => void;
  /** Extra buttons rendered at the end of the bar under the video. */
  actions?: ReactNode;
  /** Shown over the top of the video in full screen, and when `isOverlayEnabled`. */
  overlay?: ReactNode;
  isOverlayEnabled?: boolean;
  /** Switches to the next (1) or previous (-1) channel, from the system's media controls. */
  onStep: (offset: 1 | -1) => void;
  isTheaterMode: boolean;
  onToggleTheater: () => void;
}

export function Player({
  channel,
  onStatusChange,
  actions,
  overlay,
  isOverlayEnabled = false,
  onStep,
  isTheaterMode,
  onToggleTheater,
}: PlayerProps) {
  const {
    videoRef,
    hlsRef,
    status,
    errorDetail,
    retry,
    isAutoMuted,
    unmute,
    getLiveWindow,
    isHlsJs,
  } = useHlsPlayer(channel.sources, { keepsSound: true });
  const { isRetrying, retryWithFeedback } = useRetryFeedback(retry);
  const dvr = useDvr(videoRef, getLiveWindow);
  useResumePosition(channel.id, status, dvr);
  const { t, language } = useI18n();
  const name = displayName(channel, language);
  const radio = isRadio(channel);
  useMediaSession(videoRef, { title: name, logo: channel.logo, onStep });
  const menu = usePlayerMenu(videoRef, hlsRef, channel.id, dvr);
  useAutoPictureInPicture(videoRef, !radio && status === 'playing');
  // Not on iPhones and iPads: playing on with the screen locked is not sure there once the
  // sound goes through Web Audio, and it cannot be tested from here.
  useLoudnessLevelling(videoRef, !radio && isHlsJs && !isAppleMobile(), channel.id);

  const frameRef = useRef<HTMLDivElement>(null);
  const controls = usePlayerControls(videoRef);
  const fullscreen = useFullscreen(frameRef, videoRef);
  const { visibility: overlayVisibility, handlePointerMove } = useStripReveal(channel.id);
  const hasMouse = useMediaQuery(MOUSE_QUERY);
  const isOverlayShown =
    hasMouse && Boolean(overlay) && (fullscreen.isFullscreen || isOverlayEnabled);

  usePlayerKeys({
    toggleFullscreen: fullscreen.toggle,
    toggleMute: controls.toggleMute,
    togglePlay: controls.togglePlay,
    togglePictureInPicture: radio ? null : controls.togglePictureInPicture,
    seekBy: dvr.canRewind ? dvr.seekBy : null,
  });

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
            data-surface="dark"
            data-idle={isOverlayShown && !overlayVisibility.isVisible}
            onPointerMove={handlePointerMove}
          >
            {/* Radio gets an element of its own: one routed through Web Audio for levelling
                (TV) must never play a stream from another site directly, or it would be silent. */}
            <Video
              key={radio ? 'radio' : 'tv'}
              ref={videoRef}
              className={styles.video}
              playsInline
            />
            {radio && <RadioStage channel={channel} name={name} status={status} />}
            <SkipIndicator videoRef={videoRef} />

            <PlayerStatusOverlay
              status={status}
              name={name}
              hasNoLink={hasNoLink}
              isUnsupportedFormat={isUnsupportedFormat}
              errorDetail={errorDetail}
              onRetry={retryWithFeedback}
              isRetrying={isRetrying}
              showsLoading={!radio}
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

            {menu.sleep.hasStopped && (
              <p className={styles.sleepStopped} role="status">
                {t.sleepStopped}
              </p>
            )}

            {/* A channel without sound has nothing to unmute. */}
            {status === 'playing' && isAutoMuted && !channel.limits?.includes('no-sound') && (
              <button type="button" className={styles.unmute} onClick={unmute}>
                {t.autoMuted}
              </button>
            )}

            <PlayerControls
              dvr={dvr}
              isFullscreen={fullscreen.isFullscreen}
              onToggleFullscreen={fullscreen.toggle}
              onTogglePictureInPicture={controls.togglePictureInPicture}
              onStep={onStep}
              isTheaterMode={isTheaterMode}
              onToggleTheater={onToggleTheater}
              menu={menu.settings}
              sleepMinutesLeft={menu.sleep.minutesLeft}
              hasPicture={!radio}
              isPlayable={status !== 'error'}
            />

            <PlayerGestures canSkip={dvr.canRewind} />
          </Container>
        </I18nProvider>
      </MediaPlayer>

      <div className={styles.bar}>
        <div className={styles.heading}>
          <h2 className={styles.title}>
            <bdi>{name}</bdi>
          </h2>
          {/* Under the picture, not over it: it never hides the broadcast or the channel bar. */}
          {channel.limits && <ChannelLimits limits={channel.limits} isFull />}
        </div>
        <div className={styles.barEnd}>{actions}</div>
      </div>
    </div>
  );
}
