import { useEffect } from 'react';
import type { BookmarkletPayload } from './bookmarklet';
import { FoundLinkList } from './FoundLinkList';
import { useStreamChecks } from './useStreamChecks';
import styles from './Admin.module.css';

interface IncomingLinksProps {
  payload: BookmarkletPayload;
  onCreateChannel: (url: string, name: string) => void;
  onDismiss: () => void;
}

/** Links the bookmark sent from a channel's page, checked and ready to become a channel. */
export function IncomingLinks({ payload, onCreateChannel, onDismiss }: IncomingLinksProps) {
  const { results, check } = useStreamChecks();

  useEffect(() => {
    check(payload.links);
  }, [payload, check]);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.subheading}>התקבלו מהסימנייה</h2>
        <button type="button" className={styles.secondary} onClick={onDismiss}>
          סגירה
        </button>
      </div>
      <p className={styles.muted}>
        {payload.title || 'דף ללא כותרת'}
        {payload.page && (
          <>
            {' · '}
            <bdi dir="ltr">{payload.page}</bdi>
          </>
        )}
      </p>
      <FoundLinkList
        links={payload.links.map((url) => ({ url, source: 'bookmark' }))}
        checks={results}
        onCheck={(url) => check([url])}
        onCreateChannel={(url) => onCreateChannel(url, payload.title)}
      />
    </section>
  );
}
