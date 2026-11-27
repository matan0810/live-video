import { useEffect, useState } from 'react';
import type { Report } from '../../shared/reports';
import { ApiError, fetchRemoteChannels, fetchReports, saveChannels } from '../api/client';
import { bundledChannels } from '../channels';
import { effectiveChannels } from '../channels/effectiveChannels';
import type { SaveState } from './ChannelEditor';
import { countChanges, draftsToChannels, toDraft, type DraftChannel } from './drafts';

/** The list viewers get right now, so the admin always edits exactly that. */
async function loadChannels() {
  const remote = await fetchRemoteChannels({ fresh: true });
  return effectiveChannels(remote, bundledChannels, __APP_VERSION__);
}

/**
 * The admin's working copy of the channel list: loaded, edited, saved, or taken back to the
 * saved list, with the viewers' reports that load alongside it.
 */
export function useChannelDrafts(token: string, onSignOut: () => void) {
  const [drafts, setDrafts] = useState<DraftChannel[] | null>(null);
  /** The list as last loaded or saved: what "cancel changes" goes back to. */
  const [saved, setSaved] = useState<DraftChannel[] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
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
        const loaded = channels.map(toDraft);
        setDrafts(loaded);
        setSaved(loaded);
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
      setSaved(drafts);
      setSaveState('saved');
    } catch (caught) {
      setSaveState('dirty');
      handleFailure(caught);
    }
  };

  const handleDiscard = () => {
    if (!saved) return;
    setDrafts(saved);
    setSaveState('clean');
    setError(null);
  };

  // Leaving with unsaved changes (a refresh, the back button) asks first.
  useEffect(() => {
    if (saveState !== 'dirty') return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saveState]);

  return {
    drafts,
    reports,
    setReports,
    saveState,
    error,
    changes: drafts && saved ? countChanges(saved, drafts) : 0,
    handleChange,
    handleSave: () => void handleSave(),
    handleDiscard,
    handleFailure,
  };
}
