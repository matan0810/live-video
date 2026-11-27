import { useEffect, useState } from 'react';
import { changesText } from './changesText';
import { ConfirmButton } from './ConfirmButton';
import type { SaveState } from './ChannelEditor';
import buttons from './Admin.module.css';
import styles from './ChannelEditor.module.css';

const SAVED_SHOWN_MS = 3000;

interface SaveBarProps {
  saveState: SaveState;
  changes: number;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Stays at the bottom while the list is long: how many changes wait, cancel, and save. It
 * shows only when there is something to say, so a quiet page has no bar.
 */
export function SaveBar({ saveState, changes, error, onSave, onDiscard }: SaveBarProps) {
  const [isSavedExpired, setIsSavedExpired] = useState(false);

  // "Saved" is shown for a moment; leaving that state (the next edit) starts it afresh.
  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = setTimeout(() => setIsSavedExpired(true), SAVED_SHOWN_MS);
    return () => {
      clearTimeout(timer);
      setIsSavedExpired(false);
    };
  }, [saveState]);
  const isSavedShown = saveState === 'saved' && !isSavedExpired;

  const hasChanges = saveState === 'dirty' && changes > 0;
  if (!hasChanges && saveState !== 'saving' && !(saveState === 'saved' && isSavedShown) && !error) {
    return null;
  }

  return (
    <div className={styles.saveBar}>
      {error && (
        <p className={styles.saveError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.saveRow}>
        <span className={styles.saveText}>
          {saveState === 'saving' && 'שומר…'}
          {saveState === 'saved' && isSavedShown && 'נשמר'}
          {hasChanges && `${changesText(changes)} שלא נשמרו`}
        </span>
        {hasChanges && (
          <ConfirmButton
            label="ביטול שינויים"
            confirmLabel={`לבטל ${changesText(changes)}? לחצו שוב`}
            onConfirm={onDiscard}
          />
        )}
        <button type="button" className={buttons.primary} disabled={!hasChanges} onClick={onSave}>
          שמירה
        </button>
      </div>
    </div>
  );
}
