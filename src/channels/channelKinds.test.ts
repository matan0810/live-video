import { describe, expect, it } from 'vitest';
import { channelsLike, kindOf, sectionsOfKind } from './channelKinds';
import type { CatalogChannel, Channel } from './index';

const tv = (id: string): CatalogChannel => ({
  id,
  name: id,
  short: id,
  sources: [],
  group: 'israel',
});
const radio = (id: string): CatalogChannel => ({
  id,
  name: id,
  short: id,
  sources: [],
  group: 'radio',
});
const own: Channel = { id: 'custom-1', name: 'x', short: 'x', sources: [] };

describe('channel kinds', () => {
  it('counts the viewer own channels as TV', () => {
    expect(kindOf(own)).toBe('tv');
    expect(kindOf(radio('kan-bet'))).toBe('radio');
  });

  it('splits favourites and sections by tab, dropping empty sections', () => {
    const sections = [
      { id: 'favorites', title: 'f', channels: [tv('kan11'), radio('kan-bet')] },
      { id: 'israel', title: 'i', channels: [tv('kan11'), tv('13')] },
      { id: 'radio', title: 'r', channels: [radio('kan-bet'), radio('103fm')] },
    ];
    expect(
      sectionsOfKind(sections, 'radio').map((s) => [s.id, s.channels.map((c) => c.id)]),
    ).toEqual([
      ['favorites', ['kan-bet']],
      ['radio', ['kan-bet', '103fm']],
    ]);
    expect(sectionsOfKind(sections, 'tv').map((s) => s.id)).toEqual(['favorites', 'israel']);
  });

  it('steps within the kind of the current channel', () => {
    const all = [tv('a'), radio('r1'), tv('b'), radio('r2')];
    expect(channelsLike(all, all[1]).map(({ id }) => id)).toEqual(['r1', 'r2']);
    expect(channelsLike(all, null).map(({ id }) => id)).toEqual(['a', 'b']);
  });
});
