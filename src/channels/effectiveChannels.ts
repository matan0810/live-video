import { isSavedListCurrent, isVersion } from '../../shared/channels/listVersion';
import { parseChannels } from '../../shared/channels/parseChannels';
import type { CatalogChannel } from '../../shared/channels/types';

/**
 * The list viewers get: the one saved in the admin area when it was saved on this version
 * of the site or a later one, otherwise the list this release was built with. Data that is
 * missing, malformed or empty also falls back to the built-in list.
 */
export function effectiveChannels(
  remote: unknown,
  bundled: readonly CatalogChannel[],
  siteVersion: string,
): readonly CatalogChannel[] {
  if (typeof remote !== 'object' || remote === null) return bundled;
  const channels = 'channels' in remote ? remote.channels : null;
  const appVersion =
    'appVersion' in remote && isVersion(remote.appVersion) ? remote.appVersion : null;
  if (channels === null || !isSavedListCurrent(appVersion, siteVersion)) return bundled;
  try {
    const parsed = parseChannels(channels);
    return parsed.length > 0 ? parsed : bundled;
  } catch {
    return bundled;
  }
}
