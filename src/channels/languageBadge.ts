import { GROUP_LANGUAGES, type Channel, type ChannelGroup } from '../../shared/channels/types';

/**
 * A short language tag ("AR", "FR"…) for a channel whose language differs from the one its
 * group mostly speaks, or null when the group already says it (or nothing is known).
 */
export function languageBadge(channel: Channel & { group?: ChannelGroup }): string | null {
  if (!channel.language || !channel.group) return null;
  return channel.language === GROUP_LANGUAGES[channel.group]
    ? null
    : channel.language.toUpperCase();
}
