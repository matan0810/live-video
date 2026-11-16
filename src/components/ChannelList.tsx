import { CHANNEL_GROUPS, GROUP_LABELS, type Channel } from '../channels';
import { ChannelCard } from './ChannelCard';
import styles from './ChannelList.module.css';

interface ChannelListProps {
  channels: readonly Channel[];
  activeChannelId: string | null;
  unavailableChannelIds: ReadonlySet<string>;
  onSelect: (channelId: string) => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  unavailableChannelIds,
  onSelect,
}: ChannelListProps) {
  return (
    <nav className={styles.list} aria-label="ערוצים">
      {CHANNEL_GROUPS.map((group) => (
        <section key={group} className={styles.group}>
          <h2 className={styles.heading}>{GROUP_LABELS[group]}</h2>
          <ul className={styles.grid}>
            {channels
              .filter((channel) => channel.group === group)
              .map((channel) => (
                <li key={channel.id}>
                  <ChannelCard
                    channel={channel}
                    isActive={channel.id === activeChannelId}
                    isUnavailable={unavailableChannelIds.has(channel.id)}
                    onSelect={onSelect}
                  />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
