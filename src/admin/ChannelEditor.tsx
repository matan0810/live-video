import { useMemo, useState } from 'react';
import type { LinkStatus } from '../../shared/linkStatus';
import { ChannelEditorRow } from './ChannelEditorRow';
import { ChannelFilters } from './ChannelFilters';
import { SaveBar } from './SaveBar';
import { healthOf, isProblem } from './channelHealth';
import { filterDrafts, type ChannelFilter } from './channelFilter';
import { createEmptyDraft, draftSources, moveDraft, type DraftChannel } from './drafts';
import { useStreamChecks } from './useStreamChecks';
import styles from './Admin.module.css';
import layout from './ChannelEditor.module.css';

export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved';

interface ChannelEditorProps {
  drafts: readonly DraftChannel[];
  saveState: SaveState;
  error: string | null;
  /** How many things differ from the saved list. */
  changes: number;
  /** The daily link check, which gives each channel's state until a check is run here. */
  linkStatus: LinkStatus | null | undefined | 'unavailable';
  onChange: (drafts: DraftChannel[]) => void;
  onSave: () => void;
  /** Back to the saved list. */
  onDiscard: () => void;
}

const SHOW_ALL: ChannelFilter = { query: '', kind: 'all' };

export function ChannelEditor({
  drafts,
  saveState,
  error,
  changes,
  linkStatus,
  onChange,
  onSave,
  onDiscard,
}: ChannelEditorProps) {
  const { results, check } = useStreamChecks();
  const [filter, setFilter] = useState<ChannelFilter>(SHOW_ALL);
  // One channel open at a time: the list stays short, and so does the thumb's way.
  const [openKey, setOpenKey] = useState<string | null>(null);

  const healthByKey = useMemo(
    () => new Map(drafts.map((draft) => [draft.key, healthOf(draft, linkStatus, results)])),
    [drafts, linkStatus, results],
  );
  const isBroken = (draft: DraftChannel) => {
    const health = healthByKey.get(draft.key);
    return health !== undefined && isProblem(health);
  };
  const shown = filterDrafts(drafts, filter, isBroken);
  const problems = drafts.filter(isBroken).length;
  const isFiltered = filter.query.trim() !== '' || filter.kind !== 'all';

  const replace = (updated: DraftChannel) =>
    onChange(drafts.map((draft) => (draft.key === updated.key ? updated : draft)));

  const addChannel = () => {
    const created = createEmptyDraft();
    setFilter(SHOW_ALL);
    setOpenKey(created.key);
    onChange([created, ...drafts]);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.subheading}>
          ערוצים ({isFiltered ? `${shown.length} מתוך ${drafts.length}` : drafts.length})
        </h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => check(drafts.flatMap(draftSources))}
          >
            בדיקת כל הקישורים
          </button>
          <button type="button" className={styles.secondary} onClick={addChannel}>
            הוספת ערוץ
          </button>
        </div>
      </div>

      <ChannelFilters filter={filter} problems={problems} onChange={setFilter} />

      {shown.length === 0 && <p className={styles.muted}>לא נמצא ערוץ.</p>}

      <ul className={layout.list}>
        {shown.map((draft) => (
          <ChannelEditorRow
            key={draft.key}
            draft={draft}
            health={healthByKey.get(draft.key) ?? { tone: 'unknown', text: 'לא נבדק' }}
            isOpen={openKey === draft.key}
            checks={results}
            canReorder={!isFiltered}
            onToggle={() => setOpenKey(openKey === draft.key ? null : draft.key)}
            onChange={replace}
            onMove={(offset) => onChange(moveDraft(drafts, draft.key, offset))}
            onRemove={() => onChange(drafts.filter(({ key }) => key !== draft.key))}
            onCheck={() => check(draftSources(draft))}
          />
        ))}
      </ul>

      <SaveBar
        saveState={saveState}
        changes={changes}
        error={error}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </section>
  );
}
