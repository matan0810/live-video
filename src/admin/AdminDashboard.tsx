import { deleteReport } from '../api/client';
import { ChannelEditor } from './ChannelEditor';
import { createEmptyDraft, withPrimarySource } from './drafts';
import type { BookmarkletPayload } from './bookmarklet';
import { BookmarkletPanel } from './BookmarkletPanel';
import { IncomingLinks } from './IncomingLinks';
import { LinkFinder } from './LinkFinder';
import { ReportsPanel } from './ReportsPanel';
import { StatusBoard } from './StatusBoard';
import { useChannelDrafts } from './useChannelDrafts';
import { useLinkStatus } from './useLinkStatus';
import { StreamSearch } from './StreamSearch';
import styles from './Admin.module.css';

interface AdminDashboardProps {
  token: string;
  onSignOut: () => void;
  /** Links sent by the bookmark, waiting to be looked at. */
  incoming: BookmarkletPayload | null;
  onDismissIncoming: () => void;
}

export function AdminDashboard({
  token,
  onSignOut,
  incoming,
  onDismissIncoming,
}: AdminDashboardProps) {
  const {
    drafts,
    reports,
    setReports,
    saveState,
    error,
    changes,
    handleChange,
    handleSave,
    handleDiscard,
    handleFailure,
  } = useChannelDrafts(token, onSignOut);
  const linkStatus = useLinkStatus(token);

  const handleDismiss = (reportId: string) => {
    deleteReport(token, reportId).then(setReports).catch(handleFailure);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>ניהול</h1>
        <div className={styles.actions}>
          <a className={styles.secondary} href={import.meta.env.BASE_URL}>
            חזרה לאתר
          </a>
          <button type="button" className={styles.secondary} onClick={onSignOut}>
            יציאה
          </button>
        </div>
      </header>

      {drafts === null ? (
        <p className={styles.muted}>{error ?? 'טוען…'}</p>
      ) : (
        <>
          {incoming && (
            <IncomingLinks
              payload={incoming}
              onDismiss={onDismissIncoming}
              onCreateChannel={(url, name) => {
                handleChange([createEmptyDraft(url, name), ...drafts]);
                onDismissIncoming();
              }}
            />
          )}
          <StatusBoard status={linkStatus} drafts={drafts} />
          <ReportsPanel
            reports={reports}
            hasChannel={(channelId) => drafts.some((draft) => draft.id === channelId)}
            onUseSuggestion={(channelId, url) =>
              handleChange(withPrimarySource(drafts, channelId, url))
            }
            onDismiss={handleDismiss}
          />
          <ChannelEditor
            drafts={drafts}
            saveState={saveState}
            error={error}
            changes={changes}
            linkStatus={linkStatus}
            onChange={handleChange}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
          <LinkFinder
            token={token}
            onCreateChannel={(url) => {
              handleChange([createEmptyDraft(url), ...drafts]);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <BookmarkletPanel />
          <StreamSearch />
        </>
      )}
    </div>
  );
}
