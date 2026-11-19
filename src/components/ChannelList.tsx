import type { Channel } from '../channels';
import { useI18n } from '../i18n/context';
import { useCollapsedSections } from '../hooks/useCollapsedSections';
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
  const { t } = useI18n();
  const { collapsed, toggle } = useCollapsedSections();
  return (
    <nav className={styles.list} aria-label={t.channels}>
      {sections.map((section) => (
        <section key={section.id} className={styles.group}>
          <h2 className={styles.heading}>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={!collapsed.has(section.id)}
              aria-controls={`section-${section.id}`}
              aria-label={
                collapsed.has(section.id)
                  ? t.expandSection(section.title)
                  : t.collapseSection(section.title)
              }
              onClick={() => toggle(section.id)}
            >
              <span className={styles.chevron} aria-hidden="true" />
              <span data-section-title>{section.title}</span>
              {collapsed.has(section.id) && (
                <span className={styles.count}>
                  {t.channelCount(section.channels.length)}
                  {section.channels.some((channel) => channel.id === activeChannelId) && (
                    <span className={styles.playing}> · {t.playingInside}</span>
                  )}
                </span>
              )}
            </button>
          </h2>
          <ul
            id={`section-${section.id}`}
            className={styles.grid}
            hidden={collapsed.has(section.id)}
          >
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
