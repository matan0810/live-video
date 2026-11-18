import { useState, type FormEvent } from 'react';
import { ApiError, extractStreamLinks } from '../api/client';
import { CheckBadge } from './CheckBadge';
import { useStreamChecks } from './useStreamChecks';
import styles from './Admin.module.css';

interface LinkFinderProps {
  token: string;
  /** Starts a new channel in the editor with this link as its source. */
  onCreateChannel: (url: string) => void;
}

type FinderState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'failed'; message: string }
  | { kind: 'done'; links: string[]; pagesScanned: number };

function describeError(error: unknown) {
  if (error instanceof ApiError && error.status === 429)
    return 'יותר מדי חיפושים. נסו שוב בעוד שעה.';
  if (error instanceof ApiError && error.status === 502) return 'לא הצלחתי לטעון את הדף.';
  if (error instanceof ApiError && error.status === 400) return 'הכתובת צריכה להתחיל ב-https://';
  return 'החיפוש נכשל.';
}

/** Finds stream links on a channel's own web page, through the Worker. */
export function LinkFinder({ token, onCreateChannel }: LinkFinderProps) {
  const [pageUrl, setPageUrl] = useState('');
  const [state, setState] = useState<FinderState>({ kind: 'idle' });
  const { results, check } = useStreamChecks();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState({ kind: 'searching' });
    try {
      const found = await extractStreamLinks(token, pageUrl.trim());
      setState({ kind: 'done', ...found });
      check(found.links);
    } catch (error) {
      setState({ kind: 'failed', message: describeError(error) });
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.subheading}>חילוץ קישור מאתר</h2>
      <p className={styles.muted}>
        הדביקו כתובת של דף שידור חי (למשל דף ה-Live של ערוץ). אחפש בו ובנגן שמוטמע בו קישורי m3u8,
        ואבדוק כל אחד. אתרים שבונים את הקישור רק בזמן הניגון לא יחזירו תוצאה.
      </p>
      <form className={styles.searchForm} onSubmit={(event) => void handleSubmit(event)}>
        <input
          className={styles.input}
          type="url"
          dir="ltr"
          required
          placeholder="https://"
          aria-label="כתובת הדף"
          value={pageUrl}
          onChange={(event) => setPageUrl(event.target.value)}
        />
        <button type="submit" className={styles.secondary} disabled={state.kind === 'searching'}>
          {state.kind === 'searching' ? 'מחפש…' : 'חילוץ'}
        </button>
      </form>

      {state.kind === 'failed' && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}
      {state.kind === 'done' && (
        <p className={styles.muted}>
          {state.links.length === 0
            ? `לא נמצאו קישורים (נסרקו ${state.pagesScanned} דפים).`
            : `נמצאו ${state.links.length} קישורים ב-${state.pagesScanned} דפים.`}
        </p>
      )}

      {state.kind === 'done' && state.links.length > 0 && (
        <ul className={styles.list}>
          {state.links.map((link) => (
            <li key={link} className={styles.card}>
              <p className={styles.url} dir="ltr">
                {link} <CheckBadge state={results.get(link)} />
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={() => check([link])}>
                  בדיקה
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => void navigator.clipboard.writeText(link).catch(() => undefined)}
                >
                  העתקה
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => onCreateChannel(link)}
                >
                  ערוץ חדש מהקישור
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
