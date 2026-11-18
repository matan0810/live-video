import { useState, type CSSProperties } from 'react';
import type { Channel } from '../channels';
import { tileHue } from '../channels/tileHue';
import styles from './ChannelTile.module.css';

interface ChannelTileProps {
  channel: Channel;
  className?: string;
}

function logoUrl(logo: string) {
  return logo.startsWith('https://') ? logo : `${import.meta.env.BASE_URL}${logo}`;
}

/**
 * The channel's logo on a light square, or its short label on a coloured one when it has
 * no logo or the logo fails to load. Decorative: the name is always shown beside it.
 */
export function ChannelTile({ channel, className }: ChannelTileProps) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logo = channel.logo && channel.logo !== failedLogo ? channel.logo : null;

  return (
    <span
      className={[styles.tile, className].filter(Boolean).join(' ')}
      data-logo={logo !== null}
      style={{ '--tile-hue': tileHue(channel.id) } as CSSProperties}
      aria-hidden="true"
    >
      {logo ? (
        <img
          className={styles.logo}
          src={logoUrl(logo)}
          alt=""
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedLogo(logo)}
        />
      ) : (
        channel.short
      )}
    </span>
  );
}
