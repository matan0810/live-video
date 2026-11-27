import { RADIO_GROUPS } from '../../shared/channels/types';
import { normalizeForSearch } from '../channels/searchChannels';
import type { DraftChannel } from './drafts';

export type KindFilter = 'all' | 'tv' | 'radio' | 'problems';

export interface ChannelFilter {
  query: string;
  kind: KindFilter;
}

const isRadioDraft = (draft: DraftChannel) => RADIO_GROUPS.some((group) => group === draft.group);

function matchesQuery(draft: DraftChannel, query: string) {
  const wanted = normalizeForSearch(query);
  if (!wanted) return true;
  return [draft.name, draft.nameEn, draft.short, draft.id].some((text) =>
    normalizeForSearch(text).includes(wanted),
  );
}

/** The channels to show: those matching the search and the type, in their saved order. */
export function filterDrafts(
  drafts: readonly DraftChannel[],
  { query, kind }: ChannelFilter,
  isBroken: (draft: DraftChannel) => boolean,
): DraftChannel[] {
  return drafts.filter((draft) => {
    if (!matchesQuery(draft, query)) return false;
    if (kind === 'tv') return !isRadioDraft(draft);
    if (kind === 'radio') return isRadioDraft(draft);
    if (kind === 'problems') return isBroken(draft);
    return true;
  });
}
