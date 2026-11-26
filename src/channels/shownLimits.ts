import { CHANNEL_LIMITS, type ChannelLimit } from '../../shared/channels/types';

interface Browser {
  canPlayHevc: boolean;
}

/**
 * The tags worth telling this viewer, most telling first. HEVC is said only where the
 * browser cannot play it: elsewhere the channel simply works, and a tag would be noise.
 */
export function shownLimits(limits: readonly ChannelLimit[], browser: Browser): ChannelLimit[] {
  return CHANNEL_LIMITS.filter(
    (limit) => limits.includes(limit) && (limit !== 'hevc' || !browser.canPlayHevc),
  );
}
