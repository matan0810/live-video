import type { ChannelVerdict } from '../../shared/linkStatus';
import { StatusDot } from './StatusDot';
import { VERDICT_TEXT, VERDICT_TONE, type VerdictGroup } from './statusBoard';
import styles from './StatusBoard.module.css';

interface StatusCountsProps {
  groups: readonly VerdictGroup[];
  open: ReadonlySet<ChannelVerdict>;
  onToggle: (verdict: ChannelVerdict) => void;
}

/** How many channels stand where, as plain words: pressing one shows or hides its channels. */
export function StatusCounts({ groups, open, onToggle }: StatusCountsProps) {
  return (
    <div className={styles.counts}>
      {groups.map(({ verdict, channels }) => (
        <button
          key={verdict}
          type="button"
          className={styles.count}
          data-quiet={verdict === 'ok' || verdict === 'abroad'}
          aria-pressed={open.has(verdict)}
          onClick={() => onToggle(verdict)}
        >
          <StatusDot tone={VERDICT_TONE[verdict]} />
          <strong>{channels.length}</strong> {VERDICT_TEXT[verdict]}
        </button>
      ))}
    </div>
  );
}
