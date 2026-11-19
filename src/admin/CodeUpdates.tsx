import { useState } from 'react';
import type { CatalogChannel } from '../../shared/channels/types';
import type { ChannelDiff } from './channelDiff';
import styles from './Admin.module.css';

interface CodeUpdatesProps {
  diff: ChannelDiff;
  /** Puts these code versions into the editor (adding or replacing by id); saved as usual. */
  onApply: (channels: CatalogChannel[]) => void;
}

/** Channel updates that arrived with a release of the site's code, offered for the live list. */
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
        <h2 className={styles.subheading}>עדכונים מקוד האתר</h2>
        <button type="button" className={styles.secondary} onClick={() => onApply(all)}>
          להחיל הכל
        </button>
      </div>
      <p className={styles.muted}>
        ערוצים שנוספו או השתנו בקוד האתר (בגרסה האחרונה) ועדיין לא ברשימה החיה. החלה מכניסה אותם
        לעורך למטה; הם נשמרים רק אחרי "שמירת השינויים".
      </p>
      <ul className={styles.list}>
        {added.map((channel) => (
          <li key={channel.id} className={styles.card}>
            <div className={styles.reportTitle}>
              <span className={styles.tag}>חדש בקוד</span>
              <strong>{channel.name}</strong>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={() => onApply([channel])}>
                הוספה
              </button>
              <button type="button" className={styles.secondary} onClick={() => hide(channel.id)}>
                התעלמות
              </button>
            </div>
          </li>
        ))}
        {changed.map(({ code, live }) => (
          <li key={code.id} className={styles.card}>
            <div className={styles.reportTitle}>
              <span className={styles.tag}>השתנה בקוד</span>
              <strong>{live.name}</strong>
            </div>
            {code.sources.join() !== live.sources.join() && (
              <p className={styles.url} dir="ltr">
                {code.sources[0]}
              </p>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={() => onApply([code])}>
                לקחת את גרסת הקוד
              </button>
              <button type="button" className={styles.secondary} onClick={() => hide(code.id)}>
                להשאיר את שלי
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
