import { useState, type CSSProperties } from 'react';
import type { Channel } from '../channels';
import { tileHue } from '../channels/tileHue';
import { useLogoTint } from '../hooks/useLogoTint';
import styles from './ChannelTile.module.css';

interface ChannelTileProps {
  channel: Channel;
  className?: string;
}

function logoUrl(logo: string) {
  return logo.startsWith('https://') ? logo : `${import.meta.env.BASE_URL}${logo}`;
}

/**
 * The channel's logo on a light square tinted with the logo's own colour, or its short label
 * on a coloured square when it has no logo or the logo fails to load. Decorative: the name is always shown beside it.
 */
export function ChannelTile({ channel, className }: ChannelTileProps) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logo = channel.logo && channel.logo !== failedLogo ? channel.logo : null;
  const logoHue = useLogoTint(logo ? logoUrl(logo) : null);

  return (
    <span
      className={[styles.tile, className].filter(Boolean).join(' ')}
      data-logo={logo !== null}
      data-tinted={typeof logoHue === 'number'}
      style={
        {
          '--tile-hue': tileHue(channel.id),
          ...(typeof logoHue === 'number' ? { '--logo-hue': logoHue } : {}),
        } as CSSProperties
      }
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
