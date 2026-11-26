import type { ChannelKind } from '../channels/channelKinds';
import type { Channel } from '../channels';
import { ChannelStrip } from '../player/ChannelStrip';
import { ListTabs } from './ListTabs';
import styles from './BigScreenBar.module.css';

interface BigScreenBarProps {
  tab: ChannelKind;
  onTab: (tab: ChannelKind) => void;
  /** The open tab's channels. */
  channels: readonly Channel[];
  activeChannelId: string | null;
  unavailableChannelIds: ReadonlySet<string>;
  onSelect: (channelId: string) => void;
}

/**
 * Under the player in TV mode, where the channel list is hidden: TV or radio, and that
 * tab's channels in large tiles.
 */
export function BigScreenBar({ tab, onTab, ...strip }: BigScreenBarProps) {
  return (
    <div className={styles.bar}>
      <ListTabs kind={tab} onChange={onTab} />
      <ChannelStrip size="large" {...strip} />
    </div>
  );
}
