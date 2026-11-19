import { useEffect, useState } from 'react';
import type { Channel } from '../channels';
import { ChannelTile } from '../components/ChannelTile';
import styles from './Admin.module.css';

type LogoStatus = 'none' | 'loading' | 'ok' | 'failed';

const STATUS_TEXT: Record<LogoStatus, string> = {
  none: 'בלי לוגו: מוצג הכינוי הקצר',
  loading: 'טוען את הלוגו…',
  ok: 'כך הלוגו ייראה ברשימה',
  failed: 'הלוגו לא נטען; הצופים יראו את הכינוי הקצר',
};

function logoAddress(logo: string) {
  return logo.startsWith('https://') ? logo : `${import.meta.env.BASE_URL}${logo}`;
}

/** Whether the logo at `logo` loads, so a broken address is noticed before saving. */
function useLogoStatus(logo: string): LogoStatus {
  const [result, setResult] = useState<{ logo: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (!logo) return;
    const image = new Image();
    image.referrerPolicy = 'no-referrer';
    image.onload = () => setResult({ logo, ok: true });
    image.onerror = () => setResult({ logo, ok: false });
    image.src = logoAddress(logo);
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [logo]);
  if (!logo) return 'none';
  if (result?.logo !== logo) return 'loading';
  return result.ok ? 'ok' : 'failed';
}

/** The channel's tile as viewers will see it, with whether its logo loads. */
export function LogoPreview({ channel }: { channel: Channel }) {
  const logo = channel.logo?.trim() ?? '';
  const status = useLogoStatus(logo);
  return (
    <div className={styles.logoPreview}>
      {/* The logo goes in only once it has loaded, so the tile and the text always agree. */}
      <ChannelTile channel={{ ...channel, logo: status === 'ok' ? logo : undefined }} />
      <span className={status === 'failed' ? styles.warning : styles.muted}>
        {STATUS_TEXT[status]}
      </span>
    </div>
  );
}
