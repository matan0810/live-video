import type { Channel } from '../channels';
import { ChannelTile } from '../components/ChannelTile';
import { useI18n } from '../i18n/context';
import styles from './RadioStage.module.css';

interface RadioStageProps {
  channel: Channel;
  name: string;
  isPlaying: boolean;
}

/**
 * What a radio station shows in place of a picture: its logo large, its name, and a quiet
 * level meter that moves while it plays. It lets clicks through to the player underneath.
 */
export function RadioStage({ channel, name, isPlaying }: RadioStageProps) {
  const { t } = useI18n();
  return (
    <div className={styles.stage} data-playing={isPlaying} aria-hidden="true">
      <ChannelTile channel={channel} className={styles.logo} />
      <p className={styles.name}>
        <bdi>{name}</bdi>
      </p>
      <p className={styles.onAir}>
        <span className={styles.meter}>
          <span />
          <span />
          <span />
          <span />
        </span>
        {t.onAir}
      </p>
    </div>
  );
}
