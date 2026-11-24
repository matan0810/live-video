import type { ChannelSection } from '../components/ChannelList';
import type { Channel, ChannelGroup } from './index';
import { isRadio } from './isRadio';

/** The list's two tabs: TV channels and radio stations never mix. */
export type ChannelKind = 'tv' | 'radio';

export function kindOf(channel: Channel & { group?: ChannelGroup }): ChannelKind {
  return isRadio(channel) ? 'radio' : 'tv';
}

/** The sections of one tab: each section keeps only that kind, empty ones are dropped. */
export function sectionsOfKind(
  sections: readonly ChannelSection[],
  kind: ChannelKind,
): ChannelSection[] {
  return sections
    .map((section) => ({
      ...section,
      channels: section.channels.filter((channel) => kindOf(channel) === kind),
    }))
    .filter((section) => section.channels.length > 0);
}

/** Channels of the same kind as `current`, in list order: what stepping moves through. */
export function channelsLike<T extends Channel & { group?: ChannelGroup }>(
  channels: readonly T[],
  current: T | null | undefined,
): T[] {
  const kind = current ? kindOf(current) : 'tv';
  return channels.filter((channel) => kindOf(channel) === kind);
}
