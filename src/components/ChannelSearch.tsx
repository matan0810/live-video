import type { RefObject } from 'react';
import styles from './ChannelSearch.module.css';

interface ChannelSearchProps {
  query: string;
  onChange: (query: string) => void;
  /** Enter plays the first channel found. */
  onPickFirst: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /** What it searches, as the open tab says: channels or stations. */
  label: string;
}

/** A search box above the channel list; "/" jumps into it. */
export function ChannelSearch({
  query,
  onChange,
  onPickFirst,
  inputRef,
  label,
}: ChannelSearchProps) {
  return (
    <input
      ref={inputRef}
      type="search"
      className={styles.search}
      value={query}
      placeholder={label}
      aria-label={label}
      enterKeyHint="go"
      autoComplete="off"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onPickFirst();
        if (event.key === 'Escape') {
          onChange('');
          event.currentTarget.blur();
        }
      }}
    />
  );
}
