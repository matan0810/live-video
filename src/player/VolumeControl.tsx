import { MuteButton, VolumeSlider } from '@videojs/react';
import { VolumeHighIcon, VolumeLowIcon, VolumeOffIcon } from '@videojs/react/icons';
import styles from './PlayerControls.module.css';

/** Mute, with a volume slider that opens beside it on hover (phones use their own keys). */
export function VolumeControl() {
  return (
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
  );
}
