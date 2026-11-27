import { describe, expect, it } from 'vitest';
import rawChannels from '../../src/channels/channels.json';
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
    expect(parseChannels([{ ...valid, nameEn: 'Demo EN' }])).toEqual([
      { ...valid, nameEn: 'Demo EN' },
    ]);
    const withLogo = { ...valid, logo: 'logos/demo.svg', language: 'fr' };
    expect(parseChannels([withLogo])).toEqual([withLogo]);
  });

  it('keeps the tags of a channel that works only in part', () => {
    const limited = { ...valid, limits: ['no-sound', 'low-quality'] };
    expect(parseChannels([limited])).toEqual([limited]);
  });

  it.each([
    ['an unknown tag', ['no-sound', 'broken']],
    ['a repeated tag', ['no-sound', 'no-sound']],
    ['an empty list', []],
    ['a single string', 'no-sound'],
  ])('refuses %s', (_, limits) => {
    expect(() => parseChannels([{ ...valid, limits }])).toThrow(/limits/);
  });

  it('keeps a channel that has no working link right now', () => {
    expect(parseChannels([{ ...valid, sources: [] }])).toEqual([{ ...valid, sources: [] }]);
  });

  it.each([
    ['a non-array', { ...valid }],
    ['an invalid id', [{ ...valid, id: 'Not Valid' }]],
    ['a missing name', [{ ...valid, name: '' }]],
    ['a missing short label', [{ ...valid, short: undefined }]],
    ['an unknown group', [{ ...valid, group: 'mars' }]],
    ['an empty English name', [{ ...valid, nameEn: ' ' }]],
    ['a logo outside logos/', [{ ...valid, logo: '../secret.svg' }]],
    ['an http logo', [{ ...valid, logo: 'http://a.example/logo.png' }]],
    ['an unknown language', [{ ...valid, language: 'xx' }]],
    ['a non-https source', [{ ...valid, sources: ['http://example.com/live.m3u8'] }]],
    ['a malformed source', [{ ...valid, sources: ['not a url'] }]],
    ['duplicate ids', [valid, valid]],
  ])('rejects %s', (_label, data) => {
    expect(() => parseChannels(data)).toThrow();
  });
});
