import { useState, type FormEvent } from 'react';
import { CheckBadge } from './CheckBadge';
import { fetchDirectory, searchDirectory, type DirectoryStream } from './streamDirectory';
import { useStreamChecks } from './useStreamChecks';
import styles from './Admin.module.css';

type SearchState = 'idle' | 'loading' | 'failed' | 'done';

/** Finds replacement links for a channel in the public iptv-org directory. */
export function StreamSearch() {
  const [query, setQuery] = useState('');
  const [directory, setDirectory] = useState<DirectoryStream[] | null>(null);
  const [matches, setMatches] = useState<DirectoryStream[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const { results, check } = useStreamChecks();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState('loading');
    try {
      // The directory is large, so it is downloaded once, on the first search.
      const streams = directory ?? (await fetchDirectory());
      setDirectory(streams);
      setMatches(searchDirectory(streams, query));
      setState('done');
    } catch {
      setState('failed');
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.subheading}>חיפוש קישור חלופי</h2>
      <p className={styles.muted}>
        חיפוש במאגר הקהילתי iptv-org לפי שם הערוץ באנגלית. בדקו קישור לפני שמעתיקים אותו לערוץ.
      </p>
      <form className={styles.searchForm} onSubmit={(event) => void handleSubmit(event)}>
        <input
          className={styles.input}
          dir="ltr"
          placeholder="Kan 11"
          aria-label="שם הערוץ באנגלית"
          required
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className={styles.secondary} disabled={state === 'loading'}>
          {state === 'loading' ? 'מחפש…' : 'חיפוש'}
        </button>
      </form>

      {state === 'failed' && (
        <p className={styles.error} role="alert">
          לא הצלחתי לטעון את המאגר.
        </p>
      )}
      {state === 'done' && matches.length === 0 && (
        <p className={styles.muted}>לא נמצאו קישורים.</p>
      )}

      <ul className={styles.list}>
        {matches.map((stream) => (
          <li key={stream.url} className={styles.card}>
            <div className={styles.reportTitle} dir="ltr">
              <strong>{stream.title || stream.channel}</strong>
              <span className={styles.muted}>
                {[stream.channel, stream.quality].filter(Boolean).join(' · ')}
              </span>
            </div>
            <p className={styles.url} dir="ltr">
              {stream.url} <CheckBadge state={results.get(stream.url)} />
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => check([stream.url])}
              >
                בדיקה
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() =>
                  void navigator.clipboard.writeText(stream.url).catch(() => undefined)
                }
              >
                העתקה
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
