import { useEffect, useRef } from 'react';
import type { Channel } from '../channels';
import { displayName } from '../channels/displayName';
import { ChannelTile } from '../components/ChannelTile';
import { useI18n } from '../i18n/context';
import styles from './ChannelStrip.module.css';

interface ChannelStripProps {
  channels: readonly Channel[];
  activeChannelId: string;
  unavailableChannelIds: ReadonlySet<string>;
  onSelect: (channelId: string) => void;
}

/** A row of channels shown over the video in full screen and theatre mode. */
export function ChannelStrip({
  channels,
  activeChannelId,
  unavailableChannelIds,
  onSelect,
}: ChannelStripProps) {
  const { t, language } = useI18n();
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeChannelId]);

  return (
    <nav className={styles.strip} aria-label={t.channelBar}>
      <ul className={styles.list}>
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
                <ChannelTile channel={channel} className={styles.tile} />
                <span className={styles.name}>
                  <bdi>{displayName(channel, language)}</bdi>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
