import type { CSSProperties } from 'react';
import type { Channel } from '../channels';
import styles from './ChannelCard.module.css';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isUnavailable: boolean;
  onSelect: (channelId: string) => void;
}

/** Gives every channel its own stable tile colour without storing one per channel. */
function hueFromId(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function ChannelCard({ channel, isActive, isUnavailable, onSelect }: ChannelCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      data-active={isActive}
      data-unavailable={isUnavailable}
      aria-pressed={isActive}
      onClick={() => onSelect(channel.id)}
    >
      <span
        className={styles.tile}
        style={{ '--tile-hue': hueFromId(channel.id) } as CSSProperties}
        aria-hidden="true"
      >
        {channel.short}
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{channel.name}</span>
        {isActive && !isUnavailable && <span className={styles.state}>מנגן עכשיו</span>}
        {isUnavailable && <span className={styles.state}>לא זמין כרגע</span>}
      </span>
    </button>
  );
}
