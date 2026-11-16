import { useCallback, useMemo, useState } from 'react';
import { catalogChannels, CHANNEL_GROUPS, GROUP_LABELS, type Channel } from './channels';
import { withChannelParam } from './channels/channelLink';
import { isCustomChannelId } from './channels/customChannels';
import { AddChannelForm } from './components/AddChannelForm';
import { ChannelList, type ChannelSection } from './components/ChannelList';
import { EmptyStage } from './components/EmptyStage';
import { IconButton } from './components/IconButton';
import { TheaterIcon } from './components/icons';
import { ShareButton } from './components/ShareButton';
import { useActiveChannel } from './hooks/useActiveChannel';
import { useCustomChannels } from './hooks/useCustomChannels';
import { useFavorites } from './hooks/useFavorites';
import { useKeyboardShortcuts, type KeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Player } from './player/Player';
import type { PlayerStatus } from './player/useHlsPlayer';
import styles from './App.module.css';

const DIGIT_SHORTCUT_COUNT = 9;

/** Groups channels for display: favourites first, then the user's own, then the catalog. */
function buildSections(
  customChannels: readonly Channel[],
  favoriteIds: readonly string[],
): ChannelSection[] {
  const allChannels = [...customChannels, ...catalogChannels];
  const isFavorite = (channel: Channel) => favoriteIds.includes(channel.id);
  const favorites = favoriteIds.flatMap(
    (id) => allChannels.find((channel) => channel.id === id) ?? [],
  );

  const sections: ChannelSection[] = [
    { id: 'favorites', title: 'מועדפים', channels: favorites },
    {
      id: 'custom',
      title: 'הערוצים שלי',
      channels: customChannels.filter((channel) => !isFavorite(channel)),
    },
    ...CHANNEL_GROUPS.map((group) => ({
      id: group,
      title: GROUP_LABELS[group],
      channels: catalogChannels.filter(
        (channel) => channel.group === group && !isFavorite(channel),
      ),
    })),
  ];
  return sections.filter((section) => section.channels.length > 0);
}

export function App() {
  const [activeChannelId, selectChannel] = useActiveChannel();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { customChannels, addCustomChannel, removeCustomChannel } = useCustomChannels();
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [unavailableChannelIds, setUnavailableChannelIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const sections = useMemo(
    () => buildSections(customChannels, favoriteIds),
    [customChannels, favoriteIds],
  );
  /** Every channel once, in the order it appears on screen. */
  const orderedChannels = useMemo(
    () => sections.flatMap((section) => section.channels),
    [sections],
  );
  const activeChannel = orderedChannels.find((channel) => channel.id === activeChannelId) ?? null;

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

  const handleAddChannel = (channel: Channel) => {
    addCustomChannel(channel);
    selectChannel(channel.id);
  };

  const handleRemoveChannel = (channelId: string) => {
    removeCustomChannel(channelId);
    if (favoriteIds.includes(channelId)) toggleFavorite(channelId);
    if (channelId === activeChannelId) selectChannel(null);
  };

  const shortcuts = useMemo<KeyboardShortcuts>(() => {
    const selectByOffset = (offset: number) => {
      if (orderedChannels.length === 0) return;
      const currentIndex = orderedChannels.findIndex((channel) => channel.id === activeChannelId);
      const startIndex = currentIndex === -1 && offset < 0 ? 0 : currentIndex;
      const nextIndex = (startIndex + offset + orderedChannels.length) % orderedChannels.length;
      const next = orderedChannels[nextIndex];
      if (next) selectChannel(next.id);
    };

    const digitShortcuts = Object.fromEntries(
      orderedChannels
        .slice(0, DIGIT_SHORTCUT_COUNT)
        .map((channel, index) => [`Digit${index + 1}`, () => selectChannel(channel.id)]),
    );

    return {
      ...digitShortcuts,
      ArrowDown: () => selectByOffset(1),
      ArrowUp: () => selectByOffset(-1),
      KeyT: () => setIsTheaterMode((current) => !current),
    };
  }, [orderedChannels, activeChannelId, selectChannel]);
  useKeyboardShortcuts(shortcuts);

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
                <>
                  {!isCustomChannelId(activeChannel.id) && (
                    <ShareButton
                      title={activeChannel.name}
                      url={withChannelParam(window.location.href, activeChannel.id)}
                    />
                  )}
                  <IconButton
                    className={styles.theaterToggle}
                    label={isTheaterMode ? 'הצגת רשימת הערוצים (T)' : 'מצב קולנוע (T)'}
                    isPressed={isTheaterMode}
                    onClick={() => setIsTheaterMode((current) => !current)}
                  >
                    <TheaterIcon />
                  </IconButton>
                </>
              }
            />
          ) : (
            <EmptyStage />
          )}
        </section>

        <aside className={styles.sidebar}>
          <ChannelList
            sections={sections}
            activeChannelId={activeChannelId}
            unavailableChannelIds={unavailableChannelIds}
            favoriteIds={favoriteIds}
            isRemovable={isCustomChannelId}
            onSelect={selectChannel}
            onToggleFavorite={toggleFavorite}
            onRemove={handleRemoveChannel}
          />
          <AddChannelForm onAdd={handleAddChannel} />
        </aside>
      </main>
    </div>
  );
}
