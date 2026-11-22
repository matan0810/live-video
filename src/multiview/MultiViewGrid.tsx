import type { Channel } from '../channels';
import { useI18n } from '../i18n/context';
import type { PlayerStatus } from '../player/useHlsPlayer';
import type { MultiView } from './multiView';
import { MultiViewTile } from './MultiViewTile';
import styles from './MultiViewGrid.module.css';

interface MultiViewGridProps {
  view: MultiView;
  channels: readonly Channel[];
  maxChannels: number;
  onFocus: (channelId: string) => void;
  onExpand: (channelId: string) => void;
  onRemove: (channelId: string) => void;
  onExit: () => void;
  onStatusChange: (channelId: string, status: PlayerStatus) => void;
}

/**
 * Several channels at once, in a grid: two side by side, then two by two (stacked on a
 * phone). Free places invite picking another channel from the list.
 */
export function MultiViewGrid({
  view,
  channels,
  maxChannels,
  onFocus,
  onExpand,
  onRemove,
  onExit,
  onStatusChange,
}: MultiViewGridProps) {
  const { t } = useI18n();
  const shown = view.channelIds.flatMap(
    (id) => channels.find((channel) => channel.id === id) ?? [],
  );
  // Two places until a third channel is added, then four; never more than fit the screen.
  const places = Math.min(maxChannels, shown.length <= 2 ? 2 : 4);
  const free = Math.max(0, places - shown.length);

  return (
    <div className={styles.multiView}>
      <div className={styles.grid} data-places={places}>
        {shown.map((channel) => (
          <MultiViewTile
            key={channel.id}
            channel={channel}
            isFocused={channel.id === view.focusedId}
            onFocus={() => onFocus(channel.id)}
            onExpand={() => onExpand(channel.id)}
            onRemove={() => onRemove(channel.id)}
            onStatusChange={onStatusChange}
          />
        ))}
        {Array.from({ length: free }, (_, index) => (
          <div key={index} className={styles.free}>
            {t.multiViewEmpty}
          </div>
        ))}
      </div>
      <div className={styles.bar}>
        <p className={styles.hint}>{t.multiViewHint(maxChannels)}</p>
        <button type="button" className={styles.exit} onClick={onExit}>
          {t.multiViewExit}
        </button>
      </div>
    </div>
  );
}
