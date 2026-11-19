import { useState, type FormEvent } from 'react';
import { ApiError, extractStreamLinks } from '../api/client';
import { CheckBadge } from './CheckBadge';
import { findStreamsForSite } from './siteDirectory';
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
  | {
      kind: 'done';
      links: string[];
      pagesScanned: number;
      /** True when the links came from the iptv-org directory, not from the page itself. */
      fromDirectory: boolean;
    };

function linkCount(count: number) {
  return count === 1 ? 'קישור אחד' : `${count} קישורים`;
}

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
      const url = pageUrl.trim();
      const found = await extractStreamLinks(token, url);
      if (found.links.length > 0) {
        setState({ kind: 'done', ...found, fromDirectory: false });
        check(found.links);
        return;
      }
      // Many sites only fetch the stream address once their player starts, so it is not in
      // the page. Fall back to streams the community directory lists for the same site.
      const listed = await findStreamsForSite(url).catch(() => []);
      const links = [...new Set(listed.map((stream) => stream.url))];
      setState({ kind: 'done', links, pagesScanned: found.pagesScanned, fromDirectory: true });
      check(links);
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
          {!state.fromDirectory
            ? `נמצאו ${linkCount(state.links.length)} (נסרקו ${state.pagesScanned} דפים).`
            : state.links.length > 0
              ? `הדף לא חושף את הקישור (הנגן שלו טוען אותו רק בזמן הניגון), אבל המאגר הקהילתי iptv-org מכיר ${linkCount(state.links.length)} לאתר הזה:`
              : 'הדף לא חושף את הקישור (הנגן שלו טוען אותו רק בזמן הניגון), וגם במאגר הקהילתי אין קישור לאתר הזה. נסו את החיפוש לפי שם הערוץ למטה.'}
        </p>
      )}

      {state.kind === 'done' && state.fromDirectory && (
        <details className={styles.howTo}>
          <summary>איך מוצאים את הקישור בעצמכם (30 שניות, במחשב)</summary>
          <ol>
            <li>לפתוח את דף השידור בכרום, וללחוץ F12.</li>
            <li>לעבור ללשונית Network, ולכתוב m3u8 בשדה הסינון.</li>
            <li>להפעיל את השידור בדף (ולרענן אם צריך).</li>
            <li>
              ללחוץ ימני על השורה הראשונה שמופיעה, Copy ואז Copy URL, ולהדביק כאן למעלה או ישירות
              בערוץ חדש.
            </li>
          </ol>
        </details>
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
