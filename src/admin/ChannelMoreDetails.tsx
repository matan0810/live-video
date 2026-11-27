import { CHANNEL_LANGUAGES } from '../../shared/channels/types';
import { LANGUAGE_NAMES } from './languageNames';
import { LimitsField } from './LimitsField';
import { LogoPreview } from './LogoPreview';
import type { DraftChannel } from './drafts';
import styles from './Admin.module.css';
import layout from './ChannelEditor.module.css';

interface ChannelMoreDetailsProps {
  draft: DraftChannel;
  onChange: (changes: Partial<DraftChannel>) => void;
  /** Moving a channel is by its place in the whole list, so only while all of it is shown. */
  canReorder: boolean;
  onMove: (offset: -1 | 1) => void;
}

/** What is rarely touched, folded away so the editor shows only name, group and links. */
export function ChannelMoreDetails({
  draft,
  onChange,
  canReorder,
  onMove,
}: ChannelMoreDetailsProps) {
  return (
    <details className={layout.more}>
      <summary>עוד פרטים</summary>
      <div className={layout.moreBody}>
        <label className={styles.field}>
          <span className={styles.label}>שם באנגלית (לא חובה)</span>
          <input
            className={styles.input}
            dir="ltr"
            value={draft.nameEn}
            onChange={(event) => onChange({ nameEn: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>תווית קצרה</span>
          <input
            className={styles.input}
            value={draft.short}
            onChange={(event) => onChange({ short: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>מזהה (אנגלית, ספרות, מקפים)</span>
          <input
            className={styles.input}
            dir="ltr"
            value={draft.id}
            onChange={(event) => onChange({ id: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>שפה</span>
          <select
            className={styles.input}
            value={draft.language}
            onChange={(event) => {
              const { value } = event.target;
              const language = CHANNEL_LANGUAGES.find((known) => known === value);
              if (language || value === '') onChange({ language: language ?? '' });
            }}
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
            onChange={(event) => onChange({ logo: event.target.value })}
          />
        </label>
        <LogoPreview
          channel={{
            id: draft.id,
            name: draft.name,
            short: draft.short,
            sources: [],
            logo: draft.logo,
          }}
        />
        <LimitsField limits={draft.limits} onChange={(limits) => onChange({ limits })} />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            disabled={!canReorder}
            onClick={() => onMove(-1)}
          >
            הזזה למעלה
          </button>
          <button
            type="button"
            className={styles.secondary}
            disabled={!canReorder}
            onClick={() => onMove(1)}
          >
            הזזה למטה
          </button>
        </div>
        {!canReorder && (
          <p className={styles.muted}>אפשר להזיז רק כשרואים את כל הרשימה (בלי חיפוש ובלי סינון).</p>
        )}
      </div>
    </details>
  );
}
