import type { CSSProperties } from 'react';
import type { Channel } from '../channels';
import { tileHue } from '../channels/tileHue';
import styles from './ChannelTile.module.css';

interface ChannelTileProps {
  channel: Channel;
  className?: string;
}

/** The coloured square with a channel's short label. Decorative: the name is shown beside it. */
export function ChannelTile({ channel, className }: ChannelTileProps) {
  return (
    <span
      className={[styles.tile, className].filter(Boolean).join(' ')}
      style={{ '--tile-hue': tileHue(channel.id) } as CSSProperties}
      aria-hidden="true"
    >
      {channel.short}
    </span>
  );
}
