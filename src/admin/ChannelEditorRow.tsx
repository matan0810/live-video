import { useEffect, useRef } from 'react';
import { CHANNEL_GROUPS } from '../channels';
import { ChannelMoreDetails } from './ChannelMoreDetails';
import { ChannelSummary } from './ChannelSummary';
import { ConfirmButton } from './ConfirmButton';
import { linkStates, type Health } from './channelHealth';
import { draftSources, withoutSource, type DraftChannel } from './drafts';
import { groupLabel } from './groupLabel';
import type { LinkStatus } from '../../shared/linkStatus';
import { StatusDot } from './StatusDot';
import type { StreamCheckState } from './useStreamChecks';
import styles from './Admin.module.css';
import layout from './ChannelEditor.module.css';

interface ChannelEditorRowProps {
  draft: DraftChannel;
  health: Health;
  isOpen: boolean;
  checks: ReadonlyMap<string, StreamCheckState>;
  /** The daily check, for what each link last did. */
  linkStatus: LinkStatus | null | undefined | 'unavailable';
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
  linkStatus,
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

          {sources.length > 0 && (
            <ul className={layout.links}>
              {linkStates(draft, linkStatus, checks).map((link, index) => (
                <li key={link.url} className={layout.link}>
                  <span className={layout.linkText}>
                    <StatusDot tone={link.tone} />
                    {index === 0 ? 'ראשי' : `גיבוי ${index}`}: {link.text}
                  </span>
                  {link.isBroken && (
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() =>
                        update({ sourcesText: withoutSource(draft, link.url).sourcesText })
                      }
                    >
                      הסרת הקישור
                    </button>
                  )}
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
