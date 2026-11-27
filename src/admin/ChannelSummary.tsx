import { ChannelTile } from '../components/ChannelTile';
import { CaretIcon } from '../components/icons';
import type { Health } from './channelHealth';
import { draftSources, type DraftChannel } from './drafts';
import { groupLabel } from './groupLabel';
import { StatusDot } from './StatusDot';
import styles from './ChannelEditor.module.css';

interface ChannelSummaryProps {
  draft: DraftChannel;
  health: Health;
  isOpen: boolean;
  onToggle: () => void;
}

/** One line per channel: its tile, name, and where it stands. Pressing it opens the editor. */
export function ChannelSummary({ draft, health, isOpen, onToggle }: ChannelSummaryProps) {
  const links = draftSources(draft).length;
  return (
    <button type="button" className={styles.summary} aria-expanded={isOpen} onClick={onToggle}>
      <span className={styles.main}>
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
          {/* On a narrow screen: one line under the name. On a wide one the same facts are
            the columns of a table, below. */}
          <span className={styles.summaryMeta}>
            <StatusDot tone={health.tone} />
            {groupLabel(draft.group)} · {health.text}
          </span>
        </span>
      </span>
      <span className={styles.cell}>{groupLabel(draft.group)}</span>
      <span className={`${styles.cell} ${styles.statusCell}`}>
        <StatusDot tone={health.tone} />
        {health.text}
      </span>
      <span className={styles.cell}>{links}</span>
      <span className={styles.caret} data-open={isOpen}>
        <CaretIcon />
      </span>
    </button>
  );
}
