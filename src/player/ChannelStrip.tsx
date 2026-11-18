import { useEffect, useRef } from 'react';
import type { Channel } from '../channels';
import { ChannelTile } from '../components/ChannelTile';
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
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeChannelId]);

  return (
    <nav className={styles.strip} aria-label="החלפת ערוץ">
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
                <span className={styles.name}>{channel.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
