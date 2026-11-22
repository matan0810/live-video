import type { RefObject } from 'react';
import { useI18n } from '../i18n/context';
import styles from './ChannelSearch.module.css';

interface ChannelSearchProps {
  query: string;
  onChange: (query: string) => void;
  /** Enter plays the first channel found. */
  onPickFirst: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

/** A search box above the channel list; "/" jumps into it. */
export function ChannelSearch({ query, onChange, onPickFirst, inputRef }: ChannelSearchProps) {
  const { t } = useI18n();
  return (
    <input
      ref={inputRef}
      type="search"
      className={styles.search}
      value={query}
      placeholder={t.searchChannels}
      aria-label={t.searchChannels}
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
