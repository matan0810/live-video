import { parseChannels } from '../../shared/channels/parseChannels';
import type {
  CatalogChannel,
  ChannelGroup,
  ChannelLanguage,
  ChannelLimit,
} from '../../shared/channels/types';

/** A channel as it is being edited: sources are free text, one address per line. */
export interface DraftChannel {
  /** Stable identity for the editor row; never saved. */
  key: string;
  id: string;
  name: string;
  /** Empty when the channel has no separate English name. */
  nameEn: string;
  short: string;
  /** Empty when the channel has no logo. */
  logo: string;
  /** Empty when the channel's language is the one its group implies. */
  language: ChannelLanguage | '';
  /** Empty when the channel works fully. */
  limits: ChannelLimit[];
  group: ChannelGroup;
  sourcesText: string;
}

export function toDraft(channel: CatalogChannel): DraftChannel {
  const { sources, nameEn = '', logo = '', language = '', limits = [], ...rest } = channel;
  return {
    ...rest,
    nameEn,
    logo,
    language,
    limits,
    key: crypto.randomUUID(),
    sourcesText: sources.join('\n'),
  };
}

export function createEmptyDraft(sourcesText = '', name = ''): DraftChannel {
  return {
    key: crypto.randomUUID(),
    id: '',
    name,
    nameEn: '',
    short: '',
    logo: '',
    language: '',
    limits: [],
    group: 'israel',
    sourcesText,
  };
}

export function draftSources(draft: DraftChannel): string[] {
  return draft.sourcesText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Converts drafts to channels, throwing the validator's message when something is wrong. */
export function draftsToChannels(drafts: readonly DraftChannel[]): CatalogChannel[] {
  return parseChannels(
    drafts.map((draft) => ({
      id: draft.id.trim(),
      name: draft.name.trim(),
      ...(draft.nameEn.trim() ? { nameEn: draft.nameEn.trim() } : {}),
      short: draft.short.trim(),
      ...(draft.logo.trim() ? { logo: draft.logo.trim() } : {}),
      ...(draft.language ? { language: draft.language } : {}),
      ...(draft.limits.length > 0 ? { limits: draft.limits } : {}),
      group: draft.group,
      sources: draftSources(draft),
    })),
  );
}

/** Puts `url` first in the sources of the channel with the given id, without duplicating it. */
export function withPrimarySource(
  drafts: readonly DraftChannel[],
  channelId: string,
  url: string,
): DraftChannel[] {
  return drafts.map((draft) =>
    draft.id === channelId
      ? {
          ...draft,
          sourcesText: [url, ...draftSources(draft).filter((source) => source !== url)].join('\n'),
        }
      : draft,
  );
}

export function moveDraft(drafts: readonly DraftChannel[], key: string, offset: -1 | 1) {
  const index = drafts.findIndex((draft) => draft.key === key);
  const target = index + offset;
  const moved = drafts[index];
  if (!moved || target < 0 || target >= drafts.length) return [...drafts];
  const next = drafts.filter((draft) => draft.key !== key);
  next.splice(target, 0, moved);
  return next;
}

/**
 * How many things differ from the saved list: each channel edited, added or removed, and one
 * more if the order changed. An edit put back counts for nothing.
 */
export function countChanges(saved: readonly DraftChannel[], current: readonly DraftChannel[]) {
  const before = new Map(saved.map((draft) => [draft.key, draft]));
  const after = new Set(current.map((draft) => draft.key));
  let changes = 0;
  for (const draft of current) {
    const old = before.get(draft.key);
    if (!old || JSON.stringify(old) !== JSON.stringify(draft)) changes += 1;
  }
  for (const draft of saved) if (!after.has(draft.key)) changes += 1;

  const keptOrder = (list: readonly DraftChannel[]) =>
    list.filter((draft) => before.has(draft.key) && after.has(draft.key)).map(({ key }) => key);
  if (keptOrder(saved).join() !== keptOrder(current).join()) changes += 1;
  return changes;
}

/** The draft without one of its links, the others kept in order. */
export function withoutSource(draft: DraftChannel, url: string): DraftChannel {
  if (!draftSources(draft).includes(url)) return draft;
  return {
    ...draft,
    sourcesText: draftSources(draft)
      .filter((source) => source !== url)
      .join('\n'),
  };
}
