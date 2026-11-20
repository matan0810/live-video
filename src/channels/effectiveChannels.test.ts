import { describe, expect, it } from 'vitest';
import type { CatalogChannel } from '../../shared/channels/types';
import { effectiveChannels } from './effectiveChannels';

const channel = (id: string): CatalogChannel => ({
  id,
  name: id,
  short: id,
  group: 'world',
  sources: [`https://a.example/${id}.m3u8`],
});
const bundled = [channel('code')];

describe('effectiveChannels', () => {
  it('uses the saved list when it was saved on this release or later', () => {
    const remote = { channels: [channel('saved')], appVersion: '2.7.1' };
    expect(effectiveChannels(remote, bundled, '2.7.1')).toEqual([channel('saved')]);
    expect(effectiveChannels({ ...remote, appVersion: '2.8.0' }, bundled, '2.7.1')).toEqual([
      channel('saved'),
    ]);
  });

  it('uses the release list when the saved one is older or has no version', () => {
    const remote = { channels: [channel('saved')], appVersion: '2.7.0' };
    expect(effectiveChannels(remote, bundled, '2.7.1')).toBe(bundled);
    expect(effectiveChannels({ channels: [channel('saved')] }, bundled, '2.7.1')).toBe(bundled);
  });

  it('falls back on missing, malformed or empty data, and on the old cached format', () => {
    expect(effectiveChannels(null, bundled, '2.7.1')).toBe(bundled);
    expect(effectiveChannels({ channels: null, appVersion: null }, bundled, '2.7.1')).toBe(bundled);
    expect(effectiveChannels({ channels: [{}], appVersion: '2.7.1' }, bundled, '2.7.1')).toBe(
      bundled,
    );
    expect(effectiveChannels({ channels: [], appVersion: '2.7.1' }, bundled, '2.7.1')).toBe(
      bundled,
    );
    expect(effectiveChannels([channel('saved')], bundled, '2.7.1')).toBe(bundled);
  });
});
