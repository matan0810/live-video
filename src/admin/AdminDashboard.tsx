import { useEffect, useState } from 'react';
import type { LinkStatus } from '../../shared/linkStatus';
import type { Report } from '../../shared/reports';
import {
  ApiError,
  deleteReport,
  fetchLinkStatus,
  fetchRemoteChannels,
  fetchReports,
  saveChannels,
} from '../api/client';
import { bundledChannels } from '../channels';
import { effectiveChannels } from '../channels/effectiveChannels';
import { ChannelEditor, type SaveState } from './ChannelEditor';
import {
  createEmptyDraft,
  draftsToChannels,
  toDraft,
  withPrimarySource,
  type DraftChannel,
} from './drafts';
import type { BookmarkletPayload } from './bookmarklet';
import { BookmarkletPanel } from './BookmarkletPanel';
import { IncomingLinks } from './IncomingLinks';
import { LinkFinder } from './LinkFinder';
import { ReportsPanel } from './ReportsPanel';
import { StatusBoard } from './StatusBoard';
import { StreamSearch } from './StreamSearch';
import styles from './Admin.module.css';

interface AdminDashboardProps {
  token: string;
  onSignOut: () => void;
  /** Links sent by the bookmark, waiting to be looked at. */
  incoming: BookmarkletPayload | null;
  onDismissIncoming: () => void;
}

/** The list viewers get right now, so the admin always edits exactly that. */
async function loadChannels() {
  const remote = await fetchRemoteChannels({ fresh: true });
  return effectiveChannels(remote, bundledChannels, __APP_VERSION__);
}

export function AdminDashboard({
  token,
  onSignOut,
  incoming,
  onDismissIncoming,
}: AdminDashboardProps) {
  const [drafts, setDrafts] = useState<DraftChannel[] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [error, setError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null | 'unavailable'>();

  /** An expired or revoked session sends the admin back to the login form. */
  const handleFailure = (caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) onSignOut();
    else setError(caught instanceof Error ? caught.message : 'שגיאה לא צפויה');
  };

  useEffect(() => {
    let isCancelled = false;
    Promise.all([loadChannels(), fetchReports(token)])
      .then(([channels, loadedReports]) => {
        if (isCancelled) return;
        setDrafts(channels.map(toDraft));
        setReports(loadedReports);
      })
      .catch((caught: unknown) => {
        if (isCancelled) return;
        if (caught instanceof ApiError && caught.status === 401) onSignOut();
        else setError('טעינת הנתונים נכשלה. רעננו את הדף.');
      });
    return () => {
      isCancelled = true;
    };
  }, [token, onSignOut]);

  // Apart from the rest: an older Worker without the endpoint must not block the editor.
  useEffect(() => {
    let isCancelled = false;
    fetchLinkStatus(token)
      .then((status) => {
        if (!isCancelled) setLinkStatus(status);
      })
      .catch((caught: unknown) => {
        if (isCancelled) return;
        if (caught instanceof ApiError && caught.status === 404) setLinkStatus(null);
        else setLinkStatus('unavailable');
      });
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleChange = (next: DraftChannel[]) => {
    setDrafts(next);
    setSaveState('dirty');
    setError(null);
  };

  const handleSave = async () => {
    if (!drafts) return;
    let channels;
    try {
      channels = draftsToChannels(drafts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'רשימת הערוצים לא תקינה');
      return;
    }
    setSaveState('saving');
    try {
      await saveChannels(token, channels);
      setSaveState('saved');
    } catch (caught) {
      setSaveState('dirty');
      handleFailure(caught);
    }
  };

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
          <StatusBoard status={linkStatus} />
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
            onChange={handleChange}
            onSave={() => void handleSave()}
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
