import { useState, type FormEvent } from 'react';
import type { FoundLink } from '../../shared/streamLinks';
import { ApiError, extractStreamLinks, type BrowserOutcome } from '../api/client';
import { FoundLinkList } from './FoundLinkList';
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
  | { kind: 'done'; links: FoundLink[]; browser: BrowserOutcome };

const BROWSER_NOTES: Partial<Record<BrowserOutcome, string>> = {
  used: 'הדף נפתח גם בדפדפן בענן.',
  unavailable: 'הדפדפן בענן לא מוגדר ב-Worker, אז נסרק רק קוד הדף.',
  'limit-reached': 'נוצלה המכסה היומית של הדפדפן בענן, אז נסרק רק קוד הדף. נסו שוב מחר.',
  failed: 'הדפדפן בענן לא הצליח לפתוח את הדף.',
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

/** Finds the stream links for a channel's web page: page, players, real browser, directory. */
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
      let links = found.links;
      if (links.length === 0) {
        // Last resort: streams the community directory lists for the same website.
        const listed = await findStreamsForSite(url).catch(() => []);
        links = [...new Set(listed.map((stream) => stream.url))].map((link) => ({
          url: link,
          source: 'directory' as const,
        }));
      }
      setState({ kind: 'done', links, browser: found.browser });
      check(links.map((link) => link.url));
    } catch (error) {
      setState({ kind: 'failed', message: describeError(error) });
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.subheading}>חילוץ קישור מאתר</h2>
      <p className={styles.muted}>
        הדביקו כתובת של דף שידור חי. אחפש קישורי m3u8 בקוד הדף ובנגן שמוטמע בו. אם לא נמצא, אפתח את
        הדף בדפדפן אמיתי בענן, אפעיל את הנגן ואתעד איזה קישור הוא מבקש. ואם גם זה לא עובד, אחפש
        במאגר הקהילתי לפי כתובת האתר. כל קישור נבדק אוטומטית.
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

      {state.kind === 'searching' && (
        <p className={styles.muted} role="status">
          סורק… אם הדף מסתיר את הקישור, פתיחה בדפדפן בענן לוקחת עד חצי דקה.
        </p>
      )}
      {state.kind === 'failed' && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}
      {state.kind === 'done' && (
        <p className={styles.muted}>
          {state.links.length > 0 ? `נמצאו ${linkCount(state.links.length)}.` : 'לא נמצא קישור.'}{' '}
          {BROWSER_NOTES[state.browser]}
        </p>
      )}

      {state.kind === 'done' && state.links.length === 0 && (
        <details className={styles.howTo} open>
          <summary>איך מוצאים את הקישור בעצמכם (30 שניות, במחשב)</summary>
          <ol>
            <li>לפתוח את דף השידור בכרום, וללחוץ F12.</li>
            <li>לעבור ללשונית Network, ולכתוב m3u8 בשדה הסינון.</li>
            <li>להפעיל את השידור בדף (ולרענן אם צריך).</li>
            <li>ללחוץ ימני על השורה הראשונה שמופיעה, Copy ואז Copy URL, ולהדביק בערוץ חדש.</li>
          </ol>
        </details>
      )}

      {state.kind === 'done' && state.links.length > 0 && (
        <FoundLinkList
          links={state.links}
          checks={results}
          onCheck={(url) => check([url])}
          onCreateChannel={onCreateChannel}
        />
      )}
    </section>
  );
}
