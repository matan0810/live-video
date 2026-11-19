import { isTemporaryLink, type FoundLink, type LinkSource } from '../../shared/streamLinks';
import { CheckBadge } from './CheckBadge';
import type { StreamCheckState } from './useStreamChecks';
import styles from './Admin.module.css';

const SOURCE_LABELS: Record<LinkSource, string> = {
  page: 'בקוד הדף',
  frame: 'בנגן המוטמע',
  browser: 'בדפדפן בענן',
  directory: 'מהמאגר הקהילתי',
};

interface FoundLinkListProps {
  links: readonly FoundLink[];
  checks: ReadonlyMap<string, StreamCheckState>;
  onCheck: (url: string) => void;
  onCreateChannel: (url: string) => void;
}

/** Links the finder found, each with where it came from and whether it is usable for long. */
export function FoundLinkList({ links, checks, onCheck, onCreateChannel }: FoundLinkListProps) {
  return (
    <ul className={styles.list}>
      {links.map((link) => {
        const isTemporary = isTemporaryLink(link.url);
        return (
          <li key={link.url} className={styles.card}>
            <div className={styles.reportTitle}>
              <span className={styles.tag}>{SOURCE_LABELS[link.source]}</span>
              <CheckBadge state={checks.get(link.url)} />
            </div>
            <p className={styles.url} dir="ltr">
              {link.url}
            </p>
            {isTemporary && (
              <p className={styles.warning}>
                קישור זמני: הוא כולל טוקן שפג תוקף אחרי זמן מה, ולכן לא מתאים כערוץ קבוע.
              </p>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={() => onCheck(link.url)}>
                בדיקה
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => void navigator.clipboard.writeText(link.url).catch(() => undefined)}
              >
                העתקה
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => onCreateChannel(link.url)}
              >
                ערוץ חדש מהקישור
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
