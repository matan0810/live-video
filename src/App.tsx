import { useCallback, useMemo, useRef, useState } from 'react';
import { buildSections } from './channels/buildSections';
import { channelsLike, kindOf, sectionsOfKind, type ChannelKind } from './channels/channelKinds';
import { isRadio } from './channels/isRadio';
import { isCustomChannelId } from './channels/customChannels';
import { filterSections } from './channels/searchChannels';
import { stepChannel } from './channels/stepChannel';
import type { Channel } from './channels';
import { AddChannelForm } from './components/AddChannelForm';
import { AppHeader } from './components/AppHeader';
import { ChannelList } from './components/ChannelList';
import { ChannelSearch } from './components/ChannelSearch';
import { EmptyStage } from './components/EmptyStage';
import { ListTabs } from './components/ListTabs';
import { PlayerActions } from './components/PlayerActions';
import { useActiveChannel } from './hooks/useActiveChannel';
import { useCatalog } from './hooks/useCatalog';
import { useChannelShortcuts } from './hooks/useChannelShortcuts';
import { useCustomChannels } from './hooks/useCustomChannels';
import { useFavorites } from './hooks/useFavorites';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useUnavailableChannels } from './hooks/useUnavailableChannels';
import { useI18n } from './i18n/context';
import { MAX_CHANNELS_NARROW, MAX_CHANNELS_WIDE } from './multiview/multiView';
import { MultiViewGrid } from './multiview/MultiViewGrid';
import { useMultiView } from './multiview/useMultiView';
import { ChannelStrip } from './player/ChannelStrip';
import { Player } from './player/Player';
import styles from './App.module.css';

export function App() {
  const { t } = useI18n();
  const catalogChannels = useCatalog();
  const [activeChannelId, selectChannel] = useActiveChannel();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { customChannels, addCustomChannel, removeCustomChannel } = useCustomChannels();
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  // The tab opens on the kind of the channel last watched (or the one a shared link opens).
  const [tab, setTab] = useState<ChannelKind>(() => {
    const last = catalogChannels.find((channel) => channel.id === activeChannelId);
    return last ? kindOf(last) : 'tv';
  });

  const sections = useMemo(
    () => buildSections(catalogChannels, customChannels, favoriteIds, t),
    [catalogChannels, customChannels, favoriteIds, t],
  );
  /** The open tab's sections, and as shown: only matching channels while searching. */
  const tabSections = useMemo(() => sectionsOfKind(sections, tab), [sections, tab]);
  const shownSections = useMemo(
    () => filterSections(tabSections, searchQuery),
    [tabSections, searchQuery],
  );
  /** Every channel once, in the order it appears on screen. */
  const orderedChannels = useMemo(
    () => sections.flatMap((section) => section.channels),
    [sections],
  );
  const activeChannel = orderedChannels.find((channel) => channel.id === activeChannelId) ?? null;
  const maxTiles = useMediaQuery('(min-width: 600px)') ? MAX_CHANNELS_WIDE : MAX_CHANNELS_NARROW;
  // Radio has no picture, so multi-view holds TV channels only.
  const multiView = useMultiView(maxTiles, (id) =>
    orderedChannels.some((channel) => channel.id === id && !isRadio(channel)),
  );
  /** The channel the list marks and stepping starts from: the heard one while watching several. */
  const currentChannelId = multiView.view?.focusedId ?? activeChannelId;
  const currentChannel = orderedChannels.find((channel) => channel.id === currentChannelId);
  /** What stepping and the full-screen bar move through: channels of the current kind. */
  const stepChannels = useMemo(
    () => channelsLike(orderedChannels, currentChannel),
    [orderedChannels, currentChannel],
  );
  // While watching several, a TV channel picked anywhere joins the grid instead of replacing
  // it; a radio station ends multi-view and plays.
  const chooseChannel = useCallback(
    (channelId: string) => {
      const picked = orderedChannels.find((channel) => channel.id === channelId);
      if (multiView.view && !(picked && isRadio(picked))) {
        multiView.pick(channelId);
        return;
      }
      if (multiView.view) multiView.exit();
      selectChannel(channelId);
    },
    [orderedChannels, multiView, selectChannel],
  );
  const { unavailableChannelIds, handleStatusChange } = useUnavailableChannels(orderedChannels);

  const handleAddChannel = (channel: Channel) => {
    addCustomChannel(channel);
    chooseChannel(channel.id);
  };

  const handleRemoveChannel = (channelId: string) => {
    removeCustomChannel(channelId);
    if (favoriteIds.includes(channelId)) toggleFavorite(channelId);
    if (channelId === activeChannelId) selectChannel(null);
  };

  const selectByOffset = useCallback(
    (offset: 1 | -1) => {
      const next = stepChannel(stepChannels, currentChannelId, offset);
      if (next) chooseChannel(next.id);
    },
    [stepChannels, currentChannelId, chooseChannel],
  );

  const toggleTheater = useCallback(() => setIsTheaterMode((current) => !current), []);
  useChannelShortcuts({
    channels: tabSections.flatMap((section) => section.channels),
    onChoose: chooseChannel,
    onStep: selectByOffset,
    onToggleTheater: toggleTheater,
    searchRef,
  });

  return (
    <div className={styles.app}>
      <AppHeader />

      <main className={styles.main} data-theater={isTheaterMode}>
        <section className={styles.stage} aria-label={t.player}>
          {multiView.view ? (
            <MultiViewGrid
              view={multiView.view}
              channels={orderedChannels}
              maxChannels={maxTiles}
              onFocus={multiView.focus}
              onExpand={(channelId) => {
                multiView.exit();
                selectChannel(channelId);
              }}
              onRemove={multiView.remove}
              onExit={() => {
                selectChannel(multiView.view?.focusedId ?? activeChannelId);
                multiView.exit();
              }}
              onStatusChange={handleStatusChange}
            />
          ) : activeChannel ? (
            <Player
              channel={activeChannel}
              onStatusChange={handleStatusChange}
              isOverlayEnabled={isTheaterMode}
              onStep={selectByOffset}
              isTheaterMode={isTheaterMode}
              onToggleTheater={toggleTheater}
              overlay={
                <ChannelStrip
                  channels={stepChannels}
                  activeChannelId={activeChannel.id}
                  unavailableChannelIds={unavailableChannelIds}
                  onSelect={selectChannel}
                />
              }
              actions={
                <PlayerActions
                  channel={activeChannel}
                  canMultiView={!isRadio(activeChannel)}
                  onStartMultiView={() => multiView.start(activeChannel.id)}
                />
              }
            />
          ) : (
            <EmptyStage />
          )}
        </section>

        <aside className={styles.sidebar}>
          <ListTabs
            kind={tab}
            onChange={(kind) => {
              setTab(kind);
              setSearchQuery('');
            }}
          />
          <ChannelSearch
            label={tab === 'radio' ? t.searchStations : t.searchChannels}
            query={searchQuery}
            onChange={setSearchQuery}
            onPickFirst={() => {
              const first = shownSections[0]?.channels[0];
              if (first) chooseChannel(first.id);
            }}
            inputRef={searchRef}
          />
          <ChannelList
            sections={shownSections}
            isSearching={searchQuery.trim() !== ''}
            activeChannelId={currentChannelId}
            unavailableChannelIds={unavailableChannelIds}
            favoriteIds={favoriteIds}
            isRemovable={isCustomChannelId}
            onSelect={chooseChannel}
            onToggleFavorite={toggleFavorite}
            onRemove={handleRemoveChannel}
          />
          <AddChannelForm onAdd={handleAddChannel} />
        </aside>
      </main>
    </div>
  );
}
