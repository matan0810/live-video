import type { Channel } from '../channels';
import { ChannelTile } from '../components/ChannelTile';
import { useI18n } from '../i18n/context';
import type { PlayerStatus } from './useHlsPlayer';
import styles from './RadioStage.module.css';

interface RadioStageProps {
  channel: Channel;
  name: string;
  status: PlayerStatus;
}

/**
 * What a radio station shows in place of a picture: its logo large, its name, and a quiet
 * level meter that moves while it plays, or a small spinner while it connects. It lets
 * clicks through to the player underneath.
 */
export function RadioStage({ channel, name, status }: RadioStageProps) {
  const { t } = useI18n();
  return (
    <div className={styles.stage} data-playing={status === 'playing'}>
      <ChannelTile channel={channel} className={styles.logo} />
      <p className={styles.name} aria-hidden="true">
        <bdi>{name}</bdi>
      </p>
      {status === 'loading' ? (
        <p className={styles.onAir} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          {t.connecting}
        </p>
      ) : (
        <p className={styles.onAir} aria-hidden="true">
          <span className={styles.meter}>
            <span />
            <span />
            <span />
            <span />
          </span>
          {t.onAir}
        </p>
      )}
    </div>
  );
}
