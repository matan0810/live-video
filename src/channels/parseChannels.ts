import { CHANNEL_GROUPS, type CatalogChannel, type ChannelGroup } from './types';
import { isHttpsUrl } from './url';

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isChannelGroup(value: unknown): value is ChannelGroup {
  return CHANNEL_GROUPS.some((group) => group === value);
}

function parseChannel(value: unknown, position: number): CatalogChannel {
  const fail = (reason: string): never => {
    throw new Error(`Channel #${position + 1}: ${reason}`);
  };

  if (!isRecord(value)) return fail('must be an object');
  const { id, name, short, group, sources } = value;

  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    return fail('"id" must contain only lowercase letters, digits and dashes');
  }
  if (!isNonEmptyString(name)) return fail(`"name" is required (id: ${id})`);
  if (!isNonEmptyString(short)) return fail(`"short" is required (id: ${id})`);
  if (!isChannelGroup(group)) {
    return fail(`"group" must be one of: ${CHANNEL_GROUPS.join(', ')} (id: ${id})`);
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    return fail(`"sources" must be a non-empty list (id: ${id})`);
  }
  if (!sources.every(isHttpsUrl)) return fail(`every source must be an https URL (id: ${id})`);

  return { id, name, short, group, sources };
}

/**
 * Validates raw channel data (from the bundled JSON today, from a remote API later)
 * and returns it as typed channels. Throws a descriptive error on the first problem.
 */
export function parseChannels(data: unknown): CatalogChannel[] {
  if (!Array.isArray(data)) throw new Error('Channel list must be an array');

  const channels = data.map(parseChannel);
  const seen = new Set<string>();
  for (const { id } of channels) {
    if (seen.has(id)) throw new Error(`Duplicate channel id: ${id}`);
    seen.add(id);
  }
  return channels;
}
