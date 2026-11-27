import type { ChannelFilter, KindFilter } from './channelFilter';
import styles from './ChannelEditor.module.css';

interface ChannelFiltersProps {
  filter: ChannelFilter;
  problems: number;
  onChange: (filter: ChannelFilter) => void;
}

const KINDS: readonly { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'tv', label: 'טלוויזיה' },
  { id: 'radio', label: 'רדיו' },
  { id: 'problems', label: 'בעיות' },
];

/** Search and type chips above the list. */
export function ChannelFilters({ filter, problems, onChange }: ChannelFiltersProps) {
  return (
    <div className={styles.filters}>
      <input
        type="search"
        className={styles.search}
        placeholder="חיפוש ערוץ…"
        aria-label="חיפוש ערוץ"
        value={filter.query}
        onChange={(event) => onChange({ ...filter, query: event.target.value })}
      />
      <div className={styles.chips} role="group" aria-label="סוג">
        {KINDS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={styles.chip}
            aria-pressed={filter.kind === id}
            onClick={() => onChange({ ...filter, kind: id })}
          >
            {label}
            {id === 'problems' && problems > 0 ? ` (${problems})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
