import { RADIO_GROUPS, type ChannelGroup } from '../../shared/channels/types';
import { STRINGS } from '../i18n/strings';

/** A group's name for the admin: radio's say "radio", since some names also exist on TV. */
export function groupLabel(group: ChannelGroup) {
  return RADIO_GROUPS.some((radio) => radio === group)
    ? `רדיו · ${STRINGS.he.groups[group]}`
    : STRINGS.he.groups[group];
}
