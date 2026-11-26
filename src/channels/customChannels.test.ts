import { describe, expect, it } from 'vitest';
import { createCustomChannel, isCustomChannelId, sanitizeCustomChannels } from './customChannels';

describe('createCustomChannel', () => {
  it('builds a channel from trimmed input', () => {
    const result = createCustomChannel('  ערוץ בדיקה ', ' https://example.com/live.m3u8 ');
    expect(result).toMatchObject({
      ok: true,
      channel: { name: 'ערוץ בדיקה', short: 'ערו', sources: ['https://example.com/live.m3u8'] },
    });
    expect(result.ok && isCustomChannelId(result.channel.id)).toBe(true);
  });

  it("names a channel added with only a link after the link's site", () => {
    expect(createCustomChannel('  ', 'https://www.tv.example.com/live.m3u8')).toMatchObject({
      ok: true,
      channel: { name: 'tv.example.com', short: 'tve' },
    });
  });

  it.each(['', 'not a url', 'http://example.com/live.m3u8'])('rejects the URL "%s"', (url) => {
    expect(createCustomChannel('Demo', url)).toEqual({ ok: false, error: 'invalid-url' });
  });
});

describe('sanitizeCustomChannels', () => {
  const valid = {
    id: 'custom-1234',
    name: 'Demo',
    short: 'Dem',
    sources: ['https://example.com/live.m3u8'],
  };

  it('keeps valid channels and drops malformed ones', () => {
    const stored = [valid, { ...valid, id: 'kan11' }, { ...valid, sources: [] }, null, 'text'];
    expect(sanitizeCustomChannels(stored)).toEqual([valid]);
  });

  it('returns an empty list for non-array data', () => {
    expect(sanitizeCustomChannels({ valid })).toEqual([]);
  });
});
