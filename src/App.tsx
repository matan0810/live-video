import { useCallback, useMemo, useState } from 'react';
import { stepChannel } from './channels/stepChannel';
import { API_URL } from './api/client';
import { CHANNEL_GROUPS, type CatalogChannel, type Channel } from './channels';
import { withChannelParam } from './channels/channelLink';
import { isCustomChannelId } from './channels/customChannels';
import { AddChannelForm } from './components/AddChannelForm';
import { ChannelList, type ChannelSection } from './components/ChannelList';
import { EmptyStage } from './components/EmptyStage';
import { ReportButton } from './components/ReportButton';
import { ShareButton } from './components/ShareButton';
import { useActiveChannel } from './hooks/useActiveChannel';
import { useCatalog } from './hooks/useCatalog';
import { useCustomChannels } from './hooks/useCustomChannels';
import { useFavorites } from './hooks/useFavorites';
import { useKeyboardShortcuts, type KeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ChannelStrip } from './player/ChannelStrip';
import { Player } from './player/Player';
import { useI18n } from './i18n/context';
import type { Strings } from './i18n/strings';
import type { PlayerStatus } from './player/useHlsPlayer';
import styles from './App.module.css';

const DIGIT_SHORTCUT_COUNT = 9;

/** Groups channels for display: favourites first, then the user's own, then the catalog. */
function buildSections(
  catalogChannels: readonly CatalogChannel[],
  customChannels: readonly Channel[],
  favoriteIds: readonly string[],
  t: Strings,
): ChannelSection[] {
  const allChannels = [...customChannels, ...catalogChannels];
  const isFavorite = (channel: Channel) => favoriteIds.includes(channel.id);
  const favorites = favoriteIds.flatMap(
    (id) => allChannels.find((channel) => channel.id === id) ?? [],
  );

  const sections: ChannelSection[] = [
    { id: 'favorites', title: t.favorites, channels: favorites },
    {
      id: 'custom',
      title: t.myChannels,
      channels: customChannels.filter((channel) => !isFavorite(channel)),
    },
    ...CHANNEL_GROUPS.map((group) => ({
      id: group,
      title: t.groups[group],
      channels: catalogChannels.filter(
        (channel) => channel.group === group && !isFavorite(channel),
      ),
    })),
  ];
  return sections.filter((section) => section.channels.length > 0);
}

export function App() {
  const { t, language, setLanguage } = useI18n();
  const catalogChannels = useCatalog();
  const [activeChannelId, selectChannel] = useActiveChannel();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { customChannels, addCustomChannel, removeCustomChannel } = useCustomChannels();
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  /** Channels whose stream failed while trying to play them, in this visit. */
  const [failedChannelIds, setFailedChannelIds] = useState<ReadonlySet<string>>(() => new Set());

  const sections = useMemo(
    () => buildSections(catalogChannels, customChannels, favoriteIds, t),
    [catalogChannels, customChannels, favoriteIds, t],
  );
  /** Every channel once, in the order it appears on screen. */
  const orderedChannels = useMemo(
    () => sections.flatMap((section) => section.channels),
    [sections],
  );
  const activeChannel = orderedChannels.find((channel) => channel.id === activeChannelId) ?? null;
  /** Failed ones, and those kept on the list without any link, marked before anyone tries. */
  const unavailableChannelIds = useMemo(
    () =>
      new Set([
        ...failedChannelIds,
        ...orderedChannels.filter((channel) => channel.sources.length === 0).map(({ id }) => id),
      ]),
    [failedChannelIds, orderedChannels],
  );

  const handleStatusChange = useCallback((channelId: string, status: PlayerStatus) => {
    if (status === 'loading') return;
    setFailedChannelIds((current) => {
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

  const selectByOffset = useCallback(
    (offset: 1 | -1) => {
      const next = stepChannel(orderedChannels, activeChannelId, offset);
      if (next) selectChannel(next.id);
    },
    [orderedChannels, activeChannelId, selectChannel],
  );

  const shortcuts = useMemo<KeyboardShortcuts>(() => {
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
  }, [orderedChannels, selectChannel, selectByOffset]);
  useKeyboardShortcuts(shortcuts);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brandDot} aria-hidden="true" />
        <h1 className={styles.brand}>{t.brand}</h1>
        <span className={styles.version}>v{__APP_VERSION__}</span>
        <button
          type="button"
          className={styles.language}
          lang={language === 'he' ? 'en' : 'he'}
          aria-label={t.switchLanguageLabel}
          onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
        >
          {t.switchLanguage}
        </button>
      </header>

      <main className={styles.main} data-theater={isTheaterMode}>
        <section className={styles.stage} aria-label={t.player}>
          {activeChannel ? (
            <Player
              channel={activeChannel}
              onStatusChange={handleStatusChange}
              isOverlayEnabled={isTheaterMode}
              onStep={selectByOffset}
              isTheaterMode={isTheaterMode}
              onToggleTheater={() => setIsTheaterMode((current) => !current)}
              overlay={
                <ChannelStrip
                  channels={orderedChannels}
                  activeChannelId={activeChannel.id}
                  unavailableChannelIds={unavailableChannelIds}
                  onSelect={selectChannel}
                />
              }
              actions={
                <>
                  {!isCustomChannelId(activeChannel.id) && (
                    <>
                      {API_URL && <ReportButton channel={activeChannel} />}
                      <ShareButton
                        title={activeChannel.name}
                        url={withChannelParam(window.location.href, activeChannel.id)}
                      />
                    </>
                  )}
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
