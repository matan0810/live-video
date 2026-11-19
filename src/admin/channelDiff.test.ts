import { describe, expect, it } from 'vitest';
import type { CatalogChannel } from '../../shared/channels/types';
import { diffChannels } from './channelDiff';

const channel = (id: string, extra: Partial<CatalogChannel> = {}): CatalogChannel => ({
  id,
  name: id.toUpperCase(),
  short: id,
  group: 'world',
  sources: [`https://a.example/${id}.m3u8`],
  ...extra,
});

describe('diffChannels', () => {
  it('finds nothing when the lists match, in any key order', () => {
    const live = [
      {
        sources: ['https://a.example/a.m3u8'],
        group: 'world',
        short: 'a',
        name: 'A',
        id: 'a',
      } as CatalogChannel,
    ];
    expect(diffChannels([channel('a')], live)).toEqual({ added: [], changed: [] });
  });

  it('lists channels only the code has', () => {
    expect(diffChannels([channel('a'), channel('b')], [channel('a')]).added).toEqual([
      channel('b'),
    ]);
  });

  it('lists channels the code changed', () => {
    const code = channel('a', { sources: ['https://new.example/a.m3u8'] });
    expect(diffChannels([code], [channel('a')]).changed).toEqual([{ code, live: channel('a') }]);
  });

  it('ignores channels only the live list has (added in the admin area)', () => {
    expect(diffChannels([], [channel('x')])).toEqual({ added: [], changed: [] });
  });
});
