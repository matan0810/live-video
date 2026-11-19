import { parseChannels } from '../../shared/channels/parseChannels';
import type { CatalogChannel, ChannelGroup, ChannelLanguage } from '../../shared/channels/types';

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
  group: ChannelGroup;
  sourcesText: string;
}

export function toDraft(channel: CatalogChannel): DraftChannel {
  const { sources, nameEn = '', logo = '', language = '', ...rest } = channel;
  return {
    ...rest,
    nameEn,
    logo,
    language,
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

/** Replaces drafts by channel id where they exist, in place, and puts new ones first. */
export function withChannels(
  drafts: readonly DraftChannel[],
  channels: readonly CatalogChannel[],
): DraftChannel[] {
  const byId = new Map(channels.map((channel) => [channel.id, channel]));
  const existing = new Set(drafts.map((draft) => draft.id));
  const added = channels.filter((channel) => !existing.has(channel.id)).map(toDraft);
  const updated = drafts.map((draft) => {
    const channel = byId.get(draft.id);
    return channel ? toDraft(channel) : draft;
  });
  return [...added, ...updated];
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
