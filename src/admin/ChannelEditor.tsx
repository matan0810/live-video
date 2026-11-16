import { ChannelEditorRow } from './ChannelEditorRow';
import { createEmptyDraft, draftSources, moveDraft, type DraftChannel } from './drafts';
import { useStreamChecks } from './useStreamChecks';
import styles from './Admin.module.css';

export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved';

interface ChannelEditorProps {
  drafts: readonly DraftChannel[];
  saveState: SaveState;
  error: string | null;
  onChange: (drafts: DraftChannel[]) => void;
  onSave: () => void;
}

const SAVE_LABELS: Record<SaveState, string> = {
  clean: 'אין שינויים',
  dirty: 'שמירת השינויים',
  saving: 'שומר…',
  saved: 'נשמר',
};

export function ChannelEditor({ drafts, saveState, error, onChange, onSave }: ChannelEditorProps) {
  const { results, check } = useStreamChecks();

  const replace = (updated: DraftChannel) =>
    onChange(drafts.map((draft) => (draft.key === updated.key ? updated : draft)));

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.subheading}>ערוצים ({drafts.length})</h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => check(drafts.flatMap(draftSources))}
          >
            בדיקת כל הקישורים
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => onChange([createEmptyDraft(), ...drafts])}
          >
            הוספת ערוץ
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={saveState !== 'dirty'}
            onClick={onSave}
          >
            {SAVE_LABELS[saveState]}
          </button>
        </div>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <ul className={styles.list}>
        {drafts.map((draft) => (
          <ChannelEditorRow
            key={draft.key}
            draft={draft}
            checks={results}
            onChange={replace}
            onMove={(offset) => onChange(moveDraft(drafts, draft.key, offset))}
            onRemove={() => onChange(drafts.filter(({ key }) => key !== draft.key))}
            onCheck={() => check(draftSources(draft))}
          />
        ))}
      </ul>
    </section>
  );
}
