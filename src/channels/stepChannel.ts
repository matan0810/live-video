import type { Channel } from './index';

/**
 * The channel `offset` steps away from the active one, in list order and wrapping around,
 * skipping channels kept on the list without a link: there is nothing to watch on them.
 * With no channel active, stepping forward starts at the first, back at the last.
 */
export function stepChannel(
  channels: readonly Channel[],
  activeId: string | null,
  offset: 1 | -1,
): Channel | null {
  const count = channels.length;
  const current = channels.findIndex((channel) => channel.id === activeId);
  const start = current === -1 ? (offset === 1 ? -1 : 0) : current;
  for (let step = 1; step <= count; step += 1) {
    const candidate = channels[(((start + offset * step) % count) + count) % count];
    if (candidate && candidate.sources.length > 0 && candidate.id !== activeId) return candidate;
  }
  return null;
}
