import type { CSSProperties } from 'react';
import type { Channel } from '../channels';
import { IconButton } from './IconButton';
import { CloseIcon, StarIcon } from './icons';
import styles from './ChannelCard.module.css';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isUnavailable: boolean;
  isFavorite: boolean;
  onSelect: (channelId: string) => void;
  onToggleFavorite: (channelId: string) => void;
  /** Provided only for channels the user may delete. */
  onRemove?: (channelId: string) => void;
}

/** Gives every channel its own stable tile colour without storing one per channel. */
function hueFromId(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function ChannelCard({
  channel,
  isActive,
  isUnavailable,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onRemove,
}: ChannelCardProps) {
  return (
    <div className={styles.card} data-active={isActive} data-unavailable={isUnavailable}>
      <button
        type="button"
        className={styles.select}
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

      <div className={styles.actions}>
        {onRemove && (
          <IconButton
            variant="ghost"
            label={`מחיקת ${channel.name}`}
            onClick={() => onRemove(channel.id)}
          >
            <CloseIcon />
          </IconButton>
        )}
        <IconButton
          variant="ghost"
          className={isFavorite ? styles.favorite : undefined}
          label={isFavorite ? `הסרת ${channel.name} מהמועדפים` : `הוספת ${channel.name} למועדפים`}
          isPressed={isFavorite}
          onClick={() => onToggleFavorite(channel.id)}
        >
          <StarIcon isFilled={isFavorite} />
        </IconButton>
      </div>
    </div>
  );
}
