import { useCallback, useState } from 'react';
import { channels } from './channels';
import { ChannelList } from './components/ChannelList';
import { EmptyStage } from './components/EmptyStage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Player } from './player/Player';
import type { PlayerStatus } from './player/useHlsPlayer';
import styles from './App.module.css';

const ACTIVE_CHANNEL_STORAGE_KEY = 'live-video:active-channel';

export function App() {
  const [activeChannelId, setActiveChannelId] = useLocalStorage<string | null>(
    ACTIVE_CHANNEL_STORAGE_KEY,
    null,
  );
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [unavailableChannelIds, setUnavailableChannelIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;

  const handleStatusChange = useCallback((channelId: string, status: PlayerStatus) => {
    if (status === 'loading') return;
    setUnavailableChannelIds((current) => {
      const isUnavailable = status === 'error';
      if (current.has(channelId) === isUnavailable) return current;
      const next = new Set(current);
      if (isUnavailable) next.add(channelId);
      else next.delete(channelId);
      return next;
    });
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brandDot} aria-hidden="true" />
        <h1 className={styles.brand}>שידור חי</h1>
      </header>

      <main className={styles.main} data-theater={isTheaterMode}>
        <section className={styles.stage} aria-label="נגן">
          {activeChannel ? (
            <Player
              channel={activeChannel}
              onStatusChange={handleStatusChange}
              actions={
                <button
                  type="button"
                  className={styles.theaterToggle}
                  aria-pressed={isTheaterMode}
                  onClick={() => setIsTheaterMode((current) => !current)}
                >
                  {isTheaterMode ? 'הצג ערוצים' : 'מצב קולנוע'}
                </button>
              }
            />
          ) : (
            <EmptyStage />
          )}
        </section>

        <aside className={styles.sidebar}>
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            unavailableChannelIds={unavailableChannelIds}
            onSelect={setActiveChannelId}
          />
        </aside>
      </main>
    </div>
  );
}
