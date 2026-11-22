import type { Channel } from './index';

/** Lower case, no accents or Hebrew vowel marks, no spaces: "Kan 11" matches "kan11". */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFKD').replace(/[̀-֑ͯ-ׇ]/g, '').toLowerCase().replace(/\s+/g, '');
}

/** Whether the channel's name (in either language), short label or id holds the query. */
export function matchesChannel(channel: Channel, query: string): boolean {
  const wanted = normalizeForSearch(query);
  if (!wanted) return true;
  return [channel.name, channel.nameEn, channel.short, channel.id].some(
    (text) => text !== undefined && normalizeForSearch(text).includes(wanted),
  );
}

interface Section {
  id: string;
  channels: readonly Channel[];
}

/**
 * The sections with only the channels that match, empty ones dropped. (A favourite is
 * listed only under favourites, so nothing shows twice.)
 */
export function filterSections<T extends Section>(sections: readonly T[], query: string): T[] {
  if (!normalizeForSearch(query)) return [...sections];
  return sections
    .map((section) => ({
      ...section,
      channels: section.channels.filter((channel) => matchesChannel(channel, query)),
    }))
    .filter((section) => section.channels.length > 0);
}
