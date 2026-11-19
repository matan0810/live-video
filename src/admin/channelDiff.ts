import type { CatalogChannel } from '../../shared/channels/types';

export interface ChannelDiff {
  /** Channels in the site's code that the live list does not have. */
  added: CatalogChannel[];
  /** Channels in both whose code version differs from the live one. */
  changed: { code: CatalogChannel; live: CatalogChannel }[];
}

/** Compares field by field, ignoring key order. */
function isSame(a: CatalogChannel, b: CatalogChannel) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(
    (key) =>
      JSON.stringify(a[key as keyof CatalogChannel]) ===
      JSON.stringify(b[key as keyof CatalogChannel]),
  );
}

/**
 * What the code's channel list (shipped with the latest release) has that the live list
 * (saved from the admin area) does not, so updates made in code can be taken over.
 */
export function diffChannels(
  code: readonly CatalogChannel[],
  live: readonly CatalogChannel[],
): ChannelDiff {
  const liveById = new Map(live.map((channel) => [channel.id, channel]));
  const added: CatalogChannel[] = [];
  const changed: ChannelDiff['changed'] = [];
  for (const channel of code) {
    const current = liveById.get(channel.id);
    if (!current) added.push(channel);
    else if (!isSame(channel, current)) changed.push({ code: channel, live: current });
  }
  return { added, changed };
}
