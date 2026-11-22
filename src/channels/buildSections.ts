import type { ChannelSection } from '../components/ChannelList';
import type { Strings } from '../i18n/strings';
import { CHANNEL_GROUPS, type CatalogChannel, type Channel } from './index';

/** Groups channels for display: favourites first, then the user's own, then the catalog. */
export function buildSections(
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
