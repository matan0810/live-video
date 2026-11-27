import { useCallback, useRef, useState } from 'react';
import { isRadio } from './channels/isRadio';
import { isCustomChannelId } from './channels/customChannels';
import type { Channel } from './channels';
import { AddChannelForm } from './components/AddChannelForm';
import { AppHeader } from './components/AppHeader';
import { BigScreenBar } from './components/BigScreenBar';
import { ChannelList } from './components/ChannelList';
import { ChannelSearch } from './components/ChannelSearch';
import { EmptyStage } from './components/EmptyStage';
import { ListTabs } from './components/ListTabs';
import { PlayerActions } from './components/PlayerActions';
import { useActiveChannel } from './hooks/useActiveChannel';
import { useCatalog } from './hooks/useCatalog';
import { useChannelChoice } from './hooks/useChannelChoice';
import { useChannelLists } from './hooks/useChannelLists';
import { useBigScreen } from './hooks/useBigScreen';
import { useChannelShortcuts } from './hooks/useChannelShortcuts';
import { useResumeSetting } from './hooks/useResumeSetting';
import { useTheme } from './hooks/useTheme';
import { resumeMaxAgeMs } from './player/resumeSetting';
import { useCustomChannels } from './hooks/useCustomChannels';
import { useFavorites } from './hooks/useFavorites';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useUnavailableChannels } from './hooks/useUnavailableChannels';
import { useI18n } from './i18n/context';
import { MAX_CHANNELS_NARROW, MAX_CHANNELS_WIDE } from './multiview/multiView';
import { MultiViewGrid } from './multiview/MultiViewGrid';
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
  const [theme, setTheme] = useTheme();
  const [isBigScreen, setBigScreen] = useBigScreen();
  const [resume, setResume] = useResumeSetting();
  const searchRef = useRef<HTMLInputElement>(null);
  const lists = useChannelLists(catalogChannels, customChannels, favoriteIds, activeChannelId, t);
  const { orderedChannels, shownSections, tab } = lists;
  const activeChannel = orderedChannels.find((channel) => channel.id === activeChannelId) ?? null;
  const maxTiles = useMediaQuery('(min-width: 600px)') ? MAX_CHANNELS_WIDE : MAX_CHANNELS_NARROW;
  const { multiView, currentChannelId, stepChannels, chooseChannel, selectByOffset } =
    useChannelChoice(orderedChannels, activeChannelId, selectChannel, maxTiles);
  const { unavailableChannelIds, handleStatusChange } = useUnavailableChannels(orderedChannels);
  const tabChannels = lists.tabSections.flatMap((section) => section.channels);

  const handleAddChannel = (channel: Channel) => {
    addCustomChannel(channel);
    // Own channels are listed under TV: from the Radio tab, go where the new one is.
    lists.changeTab('tv');
    chooseChannel(channel.id);
  };

  const handleRemoveChannel = (channelId: string) => {
    removeCustomChannel(channelId);
    if (favoriteIds.includes(channelId)) toggleFavorite(channelId);
    if (channelId === activeChannelId) selectChannel(null);
  };

  const toggleTheater = useCallback(() => setIsTheaterMode((current) => !current), []);
  useChannelShortcuts({
    channels: tabChannels,
    onChoose: chooseChannel,
    onStep: selectByOffset,
    onToggleTheater: toggleTheater,
    onToggleTab: () => lists.changeTab(tab === 'tv' ? 'radio' : 'tv'),
    onToggleBigScreen: () => setBigScreen(!isBigScreen),
    searchRef,
  });

  return (
    <div className={styles.app} data-big-screen={isBigScreen}>
      <AppHeader
        theme={theme}
        onTheme={setTheme}
        isBigScreen={isBigScreen}
        onBigScreen={setBigScreen}
        resume={resume}
        onResume={setResume}
      />

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
              resumeMaxAgeMs={resumeMaxAgeMs(resume)}
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
          {isBigScreen && !multiView.view && (
            <BigScreenBar
              tab={tab}
              onTab={lists.changeTab}
              channels={tabChannels}
              activeChannelId={activeChannel?.id ?? null}
              unavailableChannelIds={unavailableChannelIds}
              onSelect={chooseChannel}
            />
          )}
        </section>

        <aside className={styles.sidebar}>
          <ListTabs kind={tab} onChange={lists.changeTab} />
          <ChannelSearch
            label={tab === 'radio' ? t.searchStations : t.searchChannels}
            query={lists.searchQuery}
            onChange={lists.setSearchQuery}
            onPickFirst={() => {
              const first = shownSections[0]?.channels[0];
              if (first) chooseChannel(first.id);
            }}
            inputRef={searchRef}
          />
          <ChannelList
            sections={shownSections}
            isSearching={lists.searchQuery.trim() !== ''}
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
