import { ChevronIcon } from '@videojs/react/icons';
import { useEffect, useRef } from 'react';
import type { Channel } from '../channels';
import { displayName } from '../channels/displayName';
import { languageBadge } from '../channels/languageBadge';
import { ChannelTile } from '../components/ChannelTile';
import { useI18n } from '../i18n/context';
import { useStripScroll } from './useStripScroll';
import styles from './ChannelStrip.module.css';

interface ChannelStripProps {
  channels: readonly Channel[];
  /** Null when nothing is playing yet (TV mode, before a channel is chosen). */
  activeChannelId: string | null;
  unavailableChannelIds: ReadonlySet<string>;
  onSelect: (channelId: string) => void;
  /** Large: under the player in the big-screen layout, with tiles to read from a sofa. */
  size?: 'compact' | 'large';
}

/** A row of channels: over the video in full screen and theatre mode, or under it on a big screen. */
export function ChannelStrip({
  channels,
  activeChannelId,
  unavailableChannelIds,
  onSelect,
  size = 'compact',
}: ChannelStripProps) {
  const { t, language } = useI18n();
  const activeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const scroll = useStripScroll(listRef);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeChannelId]);

  return (
    <nav className={styles.strip} data-size={size} aria-label={t.channelBar}>
      {scroll.hasBefore && (
        <button
          type="button"
          className={styles.edge}
          data-side="before"
          aria-label={t.stripBack}
          onClick={() => scroll.page('before')}
        >
          <ChevronIcon data-point={t.dir === 'rtl' ? 'right' : 'left'} />
        </button>
      )}
      <ul ref={listRef} className={styles.list}>
        {channels.map((channel) => {
          const isActive = channel.id === activeChannelId;
          return (
            <li key={channel.id}>
              <button
                ref={isActive ? activeRef : undefined}
                type="button"
                className={styles.channel}
                data-active={isActive}
                data-unavailable={unavailableChannelIds.has(channel.id)}
                aria-pressed={isActive}
                onClick={() => onSelect(channel.id)}
              >
                <ChannelTile
                  channel={channel}
                  badge={languageBadge(channel)}
                  className={styles.tile}
                />
                <span className={styles.name}>
                  <bdi>{displayName(channel, language)}</bdi>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {scroll.hasAfter && (
        <button
          type="button"
          className={styles.edge}
          data-side="after"
          aria-label={t.stripForward}
          onClick={() => scroll.page('after')}
        >
          <ChevronIcon data-point={t.dir === 'rtl' ? 'left' : 'right'} />
        </button>
      )}
    </nav>
  );
}
