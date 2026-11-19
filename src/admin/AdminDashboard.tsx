import { useEffect, useState } from 'react';
import { parseChannels } from '../../shared/channels/parseChannels';
import type { Report } from '../../shared/reports';
import {
  ApiError,
  deleteReport,
  fetchRemoteChannels,
  fetchReports,
  saveChannels,
} from '../api/client';
import { bundledChannels } from '../channels';
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
import { diffChannels, type ChannelDiff } from './channelDiff';
import { CodeUpdates } from './CodeUpdates';
import { IncomingLinks } from './IncomingLinks';
import { LinkFinder } from './LinkFinder';
import { ReportsPanel } from './ReportsPanel';
import { StreamSearch } from './StreamSearch';
import styles from './Admin.module.css';

interface AdminDashboardProps {
  token: string;
  onSignOut: () => void;
  /** Links sent by the bookmark, waiting to be looked at. */
  incoming: BookmarkletPayload | null;
  onDismissIncoming: () => void;
}

/** The saved remote list, or the list bundled with the site when none was saved yet. */
async function loadChannels() {
  const remote = await fetchRemoteChannels({ fresh: true });
  return remote === null ? bundledChannels : parseChannels(remote);
}

const NO_DIFF: ChannelDiff = { added: [], changed: [] };

export function AdminDashboard({
  token,
  onSignOut,
  incoming,
  onDismissIncoming,
}: AdminDashboardProps) {
  const [drafts, setDrafts] = useState<DraftChannel[] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [codeDiff, setCodeDiff] = useState<ChannelDiff>(NO_DIFF);
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [error, setError] = useState<string | null>(null);

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
        setCodeDiff(diffChannels(bundledChannels, channels));
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
          <CodeUpdates
            diff={codeDiff}
            onApply={(updates) => {
              const ids = new Set(updates.map((channel) => channel.id));
              const kept = drafts.filter((draft) => !ids.has(draft.id));
              handleChange([...updates.map(toDraft), ...kept]);
              setCodeDiff((current) => ({
                added: current.added.filter((channel) => !ids.has(channel.id)),
                changed: current.changed.filter(({ code }) => !ids.has(code.id)),
              }));
            }}
          />
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
