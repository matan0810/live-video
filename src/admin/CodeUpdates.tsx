import { useState } from 'react';
import type { CatalogChannel } from '../../shared/channels/types';
import type { ChannelDiff } from './channelDiff';
import { LogoPreview } from './LogoPreview';
import styles from './Admin.module.css';

interface CodeUpdatesProps {
  diff: ChannelDiff;
  /** Puts these channels into the editor (adding or replacing by id); saved as usual. */
  onApply: (channels: CatalogChannel[]) => void;
}

const FIELD_NAMES: Record<keyof CatalogChannel, string> = {
  id: 'מזהה',
  name: 'שם',
  nameEn: 'שם באנגלית',
  short: 'כינוי קצר',
  logo: 'לוגו',
  language: 'שפה',
  group: 'קבוצה',
  sources: 'קישורי שידור',
};

/** The fields, in words, that a site update changed in a channel. */
function changedFields(next: CatalogChannel, current: CatalogChannel) {
  return (Object.keys(FIELD_NAMES) as (keyof CatalogChannel)[])
    .filter((key) => JSON.stringify(next[key]) !== JSON.stringify(current[key]))
    .map((key) => FIELD_NAMES[key])
    .join(', ');
}

/** Channels that a site update added or changed, offered for the list viewers see. */
export function CodeUpdates({ diff, onApply }: CodeUpdatesProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const added = diff.added.filter((channel) => !hidden.has(channel.id));
  const changed = diff.changed.filter(({ code }) => !hidden.has(code.id));
  if (added.length === 0 && changed.length === 0) return null;

  const hide = (id: string) => setHidden((current) => new Set(current).add(id));
  const all = [...added, ...changed.map(({ code }) => code)];

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.subheading}>ערוצים מעדכון האתר</h2>
        <button type="button" className={styles.secondary} onClick={() => onApply(all)}>
          לקבל את כולם
        </button>
      </div>
      <p className={styles.muted}>
        העדכון האחרון של האתר הוסיף או שינה ערוצים שעדיין לא ברשימה שלך. מה שתקבל ייכנס לרשימה למטה,
        והצופים יראו אותו רק אחרי "שמירת השינויים". מה שתדחה יישאר כמו שהוא.
      </p>
      <ul className={styles.list}>
        {added.map((channel) => (
          <li key={channel.id} className={styles.card}>
            <div className={styles.reportTitle}>
              <span className={styles.tag}>ערוץ חדש</span>
              <strong>{channel.name}</strong>
            </div>
            <LogoPreview channel={channel} />
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={() => onApply([channel])}>
                להוסיף לרשימה
              </button>
              <button type="button" className={styles.secondary} onClick={() => hide(channel.id)}>
                לא להוסיף
              </button>
            </div>
          </li>
        ))}
        {changed.map(({ code, live }) => (
          <li key={code.id} className={styles.card}>
            <div className={styles.reportTitle}>
              <span className={styles.tag}>עודכן</span>
              <strong>{live.name}</strong>
            </div>
            <p className={styles.muted}>השתנה: {changedFields(code, live)}</p>
            {code.logo !== live.logo && <LogoPreview channel={code} />}
            {code.sources.join() !== live.sources.join() && (
              <p className={styles.url} dir="ltr">
                {code.sources[0]}
              </p>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={() => onApply([code])}>
                לעדכן את הערוץ
              </button>
              <button type="button" className={styles.secondary} onClick={() => hide(code.id)}>
                להשאיר כמו שהוא
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
