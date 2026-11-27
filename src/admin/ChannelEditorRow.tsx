import { useEffect, useRef } from 'react';
import { CHANNEL_GROUPS } from '../channels';
import { CheckBadge } from './CheckBadge';
import { ChannelMoreDetails } from './ChannelMoreDetails';
import { ChannelSummary } from './ChannelSummary';
import { ConfirmButton } from './ConfirmButton';
import type { Health } from './channelHealth';
import { draftSources, type DraftChannel } from './drafts';
import { groupLabel } from './groupLabel';
import type { StreamCheckState } from './useStreamChecks';
import styles from './Admin.module.css';
import layout from './ChannelEditor.module.css';

interface ChannelEditorRowProps {
  draft: DraftChannel;
  health: Health;
  isOpen: boolean;
  checks: ReadonlyMap<string, StreamCheckState>;
  canReorder: boolean;
  onToggle: () => void;
  onChange: (draft: DraftChannel) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onCheck: () => void;
}

/** A channel in the list: one line, which opens into its editor when pressed. */
export function ChannelEditorRow({
  draft,
  health,
  isOpen,
  checks,
  canReorder,
  onToggle,
  onChange,
  onMove,
  onRemove,
  onCheck,
}: ChannelEditorRowProps) {
  const ref = useRef<HTMLLIElement>(null);
  const update = (changes: Partial<DraftChannel>) => onChange({ ...draft, ...changes });
  const sources = draftSources(draft);

  // Opening one row closes another above it, which shifts the page: bring this one into view.
  useEffect(() => {
    if (isOpen) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [isOpen]);

  return (
    <li ref={ref} className={layout.row} data-open={isOpen}>
      <ChannelSummary draft={draft} health={health} isOpen={isOpen} onToggle={onToggle} />
      {isOpen && (
        <div className={layout.form}>
          <label className={styles.field}>
            <span className={styles.label}>שם</span>
            <input
              className={styles.input}
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>קבוצה</span>
            <select
              className={styles.input}
              value={draft.group}
              onChange={(event) => {
                const group = CHANNEL_GROUPS.find((known) => known === event.target.value);
                if (group) update({ group });
              }}
            >
              {CHANNEL_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {groupLabel(group)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>קישורים – אחד בכל שורה, הראשון הוא הראשי</span>
            <textarea
              className={styles.input}
              dir="ltr"
              rows={Math.max(2, sources.length + 1)}
              value={draft.sourcesText}
              onChange={(event) => update({ sourcesText: event.target.value })}
            />
          </label>

          {sources.some((url) => checks.has(url)) && (
            <ul className={styles.checks}>
              {sources.map((url, index) => (
                <li key={url}>
                  קישור {index + 1}: <CheckBadge state={checks.get(url)} />
                </li>
              ))}
            </ul>
          )}

          <ChannelMoreDetails
            draft={draft}
            onChange={update}
            canReorder={canReorder}
            onMove={onMove}
          />

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={onCheck}>
              בדיקת הקישורים
            </button>
            <ConfirmButton
              isDanger
              label="מחיקה"
              confirmLabel="למחוק את הערוץ? לחצו שוב"
              onConfirm={onRemove}
            />
          </div>
        </div>
      )}
    </li>
  );
}
