import { CHANNEL_LANGUAGES, type ChannelLanguage } from '../../shared/channels/types';
import { CHANNEL_GROUPS, type ChannelGroup } from '../channels';
import { RADIO_GROUPS } from '../../shared/channels/types';
import { STRINGS } from '../i18n/strings';
import { CheckBadge } from './CheckBadge';
import { LANGUAGE_NAMES } from './languageNames';
import { LogoPreview } from './LogoPreview';
import { draftSources, type DraftChannel } from './drafts';
import type { StreamCheckState } from './useStreamChecks';
import styles from './Admin.module.css';

interface ChannelEditorRowProps {
  draft: DraftChannel;
  checks: ReadonlyMap<string, StreamCheckState>;
  onChange: (draft: DraftChannel) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onCheck: () => void;
}

export function ChannelEditorRow({
  draft,
  checks,
  onChange,
  onMove,
  onRemove,
  onCheck,
}: ChannelEditorRowProps) {
  const update = (changes: Partial<DraftChannel>) => onChange({ ...draft, ...changes });
  const sources = draftSources(draft);

  return (
    <li className={styles.card}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>שם</span>
          <input
            className={styles.input}
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>שם באנגלית (לא חובה)</span>
          <input
            className={styles.input}
            dir="ltr"
            value={draft.nameEn}
            onChange={(event) => update({ nameEn: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>תווית קצרה</span>
          <input
            className={styles.input}
            value={draft.short}
            onChange={(event) => update({ short: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>מזהה (אנגלית, ספרות, מקפים)</span>
          <input
            className={styles.input}
            dir="ltr"
            value={draft.id}
            onChange={(event) => update({ id: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>קבוצה</span>
          <select
            className={styles.input}
            value={draft.group}
            onChange={(event) => update({ group: event.target.value as ChannelGroup })}
          >
            {CHANNEL_GROUPS.map((group) => (
              <option key={group} value={group}>
                {/* Radio's sections share names with nothing in TV, but say "radio" here. */}
                {RADIO_GROUPS.some((radio) => radio === group)
                  ? `רדיו · ${STRINGS.he.groups[group]}`
                  : STRINGS.he.groups[group]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>שפה</span>
          <select
            className={styles.input}
            value={draft.language}
            onChange={(event) => update({ language: event.target.value as ChannelLanguage | '' })}
          >
            <option value="">לפי הקבוצה</option>
            {CHANNEL_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {LANGUAGE_NAMES[language]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>קישור ללוגו (לא חובה)</span>
          <input
            className={styles.input}
            dir="ltr"
            value={draft.logo}
            onChange={(event) => update({ logo: event.target.value })}
          />
        </label>
      </div>

      <LogoPreview
        channel={{
          id: draft.id,
          name: draft.name,
          short: draft.short,
          sources: [],
          logo: draft.logo,
        }}
      />

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

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCheck}>
          בדיקת הקישורים
        </button>
        <button type="button" className={styles.secondary} onClick={() => onMove(-1)}>
          למעלה
        </button>
        <button type="button" className={styles.secondary} onClick={() => onMove(1)}>
          למטה
        </button>
        <button type="button" className={styles.danger} onClick={onRemove}>
          מחיקה
        </button>
      </div>
    </li>
  );
}
