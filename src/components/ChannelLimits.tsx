import type { ChannelLimit } from '../../shared/channels/types';
import { shownLimits } from '../channels/shownLimits';
import { canPlayHevc } from '../device';
import { useI18n } from '../i18n/context';
import styles from './ChannelLimits.module.css';

interface ChannelLimitsProps {
  limits: readonly ChannelLimit[];
  /** Every limit (under the player), or only the first, which says the most (in the list). */
  isFull?: boolean;
}

/** An amber dot and a few words: how this channel works only in part. */
export function ChannelLimits({ limits, isFull = false }: ChannelLimitsProps) {
  const { t } = useI18n();
  const ordered = shownLimits(limits, { canPlayHevc: canPlayHevc() });
  const shown = isFull ? ordered : ordered.slice(0, 1);
  if (shown.length === 0) return null;
  return (
    <span className={styles.limits} data-full={isFull}>
      {shown.map((limit) => t.limits[limit]).join(' · ')}
    </span>
  );
}
