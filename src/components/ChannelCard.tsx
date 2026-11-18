import type { Channel } from '../channels';
import { displayName } from '../channels/displayName';
import { useI18n } from '../i18n/context';
import { ChannelTile } from './ChannelTile';
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

export function ChannelCard({
  channel,
  isActive,
  isUnavailable,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onRemove,
}: ChannelCardProps) {
  const { t, language } = useI18n();
  const name = displayName(channel, language);
  return (
    <div className={styles.card} data-active={isActive} data-unavailable={isUnavailable}>
      <button
        type="button"
        className={styles.select}
        aria-pressed={isActive}
        onClick={() => onSelect(channel.id)}
      >
        <ChannelTile channel={channel} className={styles.tile} />
        <span className={styles.text}>
          <span className={styles.name}>{name}</span>
          {isActive && !isUnavailable && <span className={styles.state}>{t.playingNow}</span>}
          {isUnavailable && <span className={styles.state}>{t.unavailable}</span>}
        </span>
      </button>

      <div className={styles.actions}>
        {onRemove && (
          <IconButton
            variant="ghost"
            label={t.removeChannel(name)}
            onClick={() => onRemove(channel.id)}
          >
            <CloseIcon />
          </IconButton>
        )}
        <IconButton
          variant="ghost"
          className={isFavorite ? styles.favorite : undefined}
          label={isFavorite ? t.removeFavorite(name) : t.addFavorite(name)}
          isPressed={isFavorite}
          onClick={() => onToggleFavorite(channel.id)}
        >
          <StarIcon isFilled={isFavorite} />
        </IconButton>
      </div>
    </div>
  );
}
