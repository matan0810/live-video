import { Controls, PlayButton } from '@videojs/react';
import {
  ChevronIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PauseIcon,
  PipEnterIcon,
  PlayIcon,
} from '@videojs/react/icons';
import { TheaterIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import { DvrSlider } from './DvrSlider';
import { ControlButton } from './ControlButton';
import { LiveButton } from './LiveButton';
import { MoreMenu } from './MoreMenu';
import type { MenuSetting } from './menuSettings';
import { SleepChip } from './SleepChip';
import type { useDvr } from './useDvr';
import { VolumeControl } from './VolumeControl';
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
  /** False for radio: nothing to show in picture in picture. */
  hasPicture: boolean;
  /** Minutes until the sleep timer pauses the player; null while it is off. */
  sleepMinutesLeft: number | null;
  /** The rows of the "⋮" menu (menuSettings.ts). */
  menu: readonly MenuSetting[];
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
  menu,
  hasPicture,
  sleepMinutesLeft,
}: PlayerControlsProps) {
  const { t } = useI18n();

  return (
    <Controls.Root>
      {/* Left to right like nearly every video player, so the skip buttons agree with the
          timeline's direction; labels stay in the site's language. */}
      <Controls.Content className={styles.controls} dir="ltr">
        {/* YouTube style: on a phone one tap brings the controls, and this pauses or resumes.
            Not on radio, where it would cover the station's card; the bar has its own. */}
        {isPlayable && hasPicture && (
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
                <VolumeControl />
                <LiveButton
                  isLive={dvr.isLive}
                  secondsBehindLive={dvr.secondsBehindLive}
                  onGoLive={dvr.goLive}
                />
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
            {isPlayable && sleepMinutesLeft !== null && (
              <SleepChip minutesLeft={sleepMinutesLeft} />
            )}
            {isPlayable && (
              <MoreMenu
                settings={menu}
                onPictureInPicture={
                  hasPicture && CAN_PICTURE_IN_PICTURE ? onTogglePictureInPicture : null
                }
              />
            )}
            {isPlayable && hasPicture && CAN_PICTURE_IN_PICTURE && (
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
