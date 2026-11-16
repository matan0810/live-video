import { describe, expect, it } from 'vitest';
import rawChannels from './channels.json';
import { parseChannels } from './parseChannels';

const valid = {
  id: 'demo',
  name: 'Demo',
  short: 'D',
  group: 'world',
  sources: ['https://example.com/live.m3u8'],
};

describe('parseChannels', () => {
  it('accepts the bundled channel list', () => {
    expect(parseChannels(rawChannels).length).toBeGreaterThan(0);
  });

  it('returns typed channels for valid data', () => {
    expect(parseChannels([valid])).toEqual([valid]);
  });

  it.each([
    ['a non-array', { ...valid }],
    ['an invalid id', [{ ...valid, id: 'Not Valid' }]],
    ['a missing name', [{ ...valid, name: '' }]],
    ['a missing short label', [{ ...valid, short: undefined }]],
    ['an unknown group', [{ ...valid, group: 'mars' }]],
    ['an empty source list', [{ ...valid, sources: [] }]],
    ['a non-https source', [{ ...valid, sources: ['http://example.com/live.m3u8'] }]],
    ['a malformed source', [{ ...valid, sources: ['not a url'] }]],
    ['duplicate ids', [valid, valid]],
  ])('rejects %s', (_label, data) => {
    expect(() => parseChannels(data)).toThrow();
  });
});
