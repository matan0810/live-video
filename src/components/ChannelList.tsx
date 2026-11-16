import type { Channel } from '../channels';
import { ChannelCard } from './ChannelCard';
import styles from './ChannelList.module.css';

export interface ChannelSection {
  id: string;
  title: string;
  channels: readonly Channel[];
}

interface ChannelListProps {
  sections: readonly ChannelSection[];
  activeChannelId: string | null;
  unavailableChannelIds: ReadonlySet<string>;
  favoriteIds: readonly string[];
  /** Tells whether the user may delete the given channel. */
  isRemovable: (channelId: string) => boolean;
  onSelect: (channelId: string) => void;
  onToggleFavorite: (channelId: string) => void;
  onRemove: (channelId: string) => void;
}

export function ChannelList({
  sections,
  activeChannelId,
  unavailableChannelIds,
  favoriteIds,
  isRemovable,
  onSelect,
  onToggleFavorite,
  onRemove,
}: ChannelListProps) {
  return (
    <nav className={styles.list} aria-label="ערוצים">
      {sections.map((section) => (
        <section key={section.id} className={styles.group}>
          <h2 className={styles.heading}>{section.title}</h2>
          <ul className={styles.grid}>
            {section.channels.map((channel) => (
              <li key={channel.id}>
                <ChannelCard
                  channel={channel}
                  isActive={channel.id === activeChannelId}
                  isUnavailable={unavailableChannelIds.has(channel.id)}
                  isFavorite={favoriteIds.includes(channel.id)}
                  onSelect={onSelect}
                  onToggleFavorite={onToggleFavorite}
                  onRemove={isRemovable(channel.id) ? onRemove : undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
