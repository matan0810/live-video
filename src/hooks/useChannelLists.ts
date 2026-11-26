import { useMemo, useState } from 'react';
import { buildSections } from '../channels/buildSections';
import { kindOf, sectionsOfKind, type ChannelKind } from '../channels/channelKinds';
import { filterSections } from '../channels/searchChannels';
import type { CatalogChannel, Channel } from '../channels';
import type { Strings } from '../i18n/strings';

/**
 * The channel list as the sidebar shows it: sections, the open tab (TV or radio) and the
 * search, and every channel once in screen order for looking channels up.
 */
export function useChannelLists(
  catalogChannels: readonly CatalogChannel[],
  customChannels: readonly Channel[],
  favoriteIds: readonly string[],
  activeChannelId: string | null,
  t: Strings,
) {
  const [searchQuery, setSearchQuery] = useState('');
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

  /** Switching tab starts a fresh search there. */
  const changeTab = (kind: ChannelKind) => {
    setTab(kind);
    setSearchQuery('');
  };

  return {
    tab,
    changeTab,
    searchQuery,
    setSearchQuery,
    tabSections,
    shownSections,
    orderedChannels,
  };
}
