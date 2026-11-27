import { ChannelTile } from '../components/ChannelTile';
import { CaretIcon } from '../components/icons';
import type { Health } from './channelHealth';
import type { DraftChannel } from './drafts';
import { groupLabel } from './groupLabel';
import styles from './ChannelEditor.module.css';

interface ChannelSummaryProps {
  draft: DraftChannel;
  health: Health;
  isOpen: boolean;
  onToggle: () => void;
}

/** One line per channel: its tile, name, and where it stands. Pressing it opens the editor. */
export function ChannelSummary({ draft, health, isOpen, onToggle }: ChannelSummaryProps) {
  return (
    <button type="button" className={styles.summary} aria-expanded={isOpen} onClick={onToggle}>
      <ChannelTile
        className={styles.tile}
        channel={{
          id: draft.id,
          name: draft.name,
          short: draft.short,
          sources: [],
          ...(draft.logo.trim() ? { logo: draft.logo.trim() } : {}),
        }}
      />
      <span className={styles.summaryText}>
        <span className={styles.summaryName}>
          <bdi>{draft.name.trim() || 'ערוץ חדש'}</bdi>
        </span>
        <span className={styles.summaryMeta}>
          <i className={styles.dot} data-tone={health.tone} aria-hidden="true" />
          {groupLabel(draft.group)} · {health.text}
        </span>
      </span>
      <span className={styles.caret} data-open={isOpen}>
        <CaretIcon />
      </span>
    </button>
  );
}
