import { Controls, MuteButton, PlayButton, VolumeSlider } from '@videojs/react';
import {
  ChevronIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PauseIcon,
  PipEnterIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
} from '@videojs/react/icons';
import type { ReactNode } from 'react';
import { TheaterIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import { DvrSlider } from './DvrSlider';
import { formatDuration } from './formatDuration';
import { MoreMenu } from './MoreMenu';
import type { useCaptions } from './useCaptions';
import type { useDvr } from './useDvr';
import styles from './PlayerControls.module.css';

const CAN_PICTURE_IN_PICTURE = document.pictureInPictureEnabled;
const SEEK_STEP_SECONDS = 10;

interface PlayerControlsProps {
  dvr: ReturnType<typeof useDvr>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTogglePictureInPicture: () => void;
  /** Switches channel, from the bar in any view. */
  onStep: (offset: 1 | -1) => void;
  /**
   * False while the channel cannot play: only switching channel and leaving full screen
   * remain, so a broken channel never leaves the viewer stuck in full screen.
   */
  isPlayable: boolean;
  /** Wide screens only, where the channel list sits beside the player. */
  isTheaterMode: boolean;
  onToggleTheater: () => void;
  captions: ReturnType<typeof useCaptions>;
}

function ControlButton({
  label,
  onClick,
  children,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * The player's controls, over the video: they fade out while watching and come back on
 * any movement or tap (Video.js tracks that). Timeline and live button for channels that
 * keep past minutes; channel switching in full screen.
 */
export function PlayerControls({
  dvr,
  isFullscreen,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onStep,
  isPlayable,
  isTheaterMode,
  onToggleTheater,
  captions,
}: PlayerControlsProps) {
  const { t } = useI18n();

  return (
    <Controls.Root>
      {/* Left to right like nearly every video player, so the skip buttons agree with the
          timeline's direction; labels stay in the site's language. */}
      <Controls.Content className={styles.controls} dir="ltr">
        {/* YouTube style: on a phone one tap brings the controls, and this pauses or resumes. */}
        {isPlayable && (
          <PlayButton
            className={styles.center}
            render={(props, state) => (
              <button {...props}>{state.paused ? <PlayIcon /> : <PauseIcon />}</button>
            )}
          />
        )}
        <div className={styles.bottom}>
          {isPlayable && dvr.canRewind && (
            <DvrSlider
              windowSeconds={dvr.windowSeconds}
              secondsBehindLive={dvr.secondsBehindLive}
              onSeekBehind={dvr.seekBehind}
            />
          )}
          <div className={styles.row}>
            {isPlayable && (
              <>
                <PlayButton
                  className={styles.button}
                  render={(props, state) => (
                    <button {...props}>{state.paused ? <PlayIcon /> : <PauseIcon />}</button>
                  )}
                />
                <div className={styles.volume}>
                  <MuteButton
                    className={styles.button}
                    render={(props, state) => (
                      <button {...props}>
                        {state.volumeLevel === 'off' ? (
                          <VolumeOffIcon />
                        ) : state.volumeLevel === 'high' ? (
                          <VolumeHighIcon />
                        ) : (
                          <VolumeLowIcon />
                        )}
                      </button>
                    )}
                  />
                  <VolumeSlider.Root className={styles.volumeSlider}>
                    <VolumeSlider.Track className={styles.volumeTrack}>
                      <VolumeSlider.Fill className={styles.volumeFill} />
                    </VolumeSlider.Track>
                    <VolumeSlider.Thumb className={styles.volumeThumb} />
                  </VolumeSlider.Root>
                </div>

                <button
                  type="button"
                  className={styles.live}
                  dir={t.dir}
                  data-live={dvr.isLive}
                  onClick={dvr.goLive}
                  // Enabled whenever behind, even on a channel without a timeline: there must
                  // always be a way back to live.
                  disabled={dvr.isLive}
                  title={dvr.isLive ? t.watchingLive : t.backToLiveTitle}
                  aria-label={dvr.isLive ? t.watchingLive : t.backToLiveTitle}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  {dvr.isLive ? (
                    t.live
                  ) : (
                    <>
                      <span className={styles.liveText}>{t.backToLive} </span>
                      <bdi>−{formatDuration(dvr.secondsBehindLive)}</bdi>
                    </>
                  )}
                </button>
              </>
            )}

            <span className={styles.spacer} />

            {isPlayable && dvr.canRewind && (
              <>
                <ControlButton
                  className={styles.skip}
                  label={t.seekBack(SEEK_STEP_SECONDS)}
                  onClick={() => dvr.seekBy(-SEEK_STEP_SECONDS)}
                  disabled={dvr.secondsBehindLive >= dvr.windowSeconds}
                >
                  <bdi className={styles.stepText}>−{SEEK_STEP_SECONDS}</bdi>
                </ControlButton>
                <ControlButton
                  className={styles.skip}
                  label={t.seekForward(SEEK_STEP_SECONDS)}
                  onClick={() => dvr.seekBy(SEEK_STEP_SECONDS)}
                  disabled={dvr.isLive}
                >
                  <bdi className={styles.stepText}>+{SEEK_STEP_SECONDS}</bdi>
                </ControlButton>
              </>
            )}
            <>
              <ControlButton label={t.previousChannel} onClick={() => onStep(-1)}>
                <ChevronIcon className={styles.chevronUp} />
              </ControlButton>
              <ControlButton label={t.nextChannel} onClick={() => onStep(1)}>
                <ChevronIcon className={styles.chevronDown} />
              </ControlButton>
            </>
            {isPlayable && (
              <MoreMenu
                captions={captions.options}
                selectedCaption={captions.selected}
                onChooseCaption={captions.choose}
              />
            )}
            {isPlayable && CAN_PICTURE_IN_PICTURE && (
              <ControlButton
                className={styles.pip}
                label={t.pictureInPicture}
                onClick={onTogglePictureInPicture}
              >
                <PipEnterIcon />
              </ControlButton>
            )}
            {!isFullscreen && (
              <ControlButton
                className={styles.theater}
                label={isTheaterMode ? t.theaterOff : t.theaterOn}
                onClick={onToggleTheater}
              >
                <TheaterIcon />
              </ControlButton>
            )}
            <ControlButton label={t.fullscreen} onClick={onToggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
            </ControlButton>
          </div>
        </div>
      </Controls.Content>
    </Controls.Root>
  );
}
