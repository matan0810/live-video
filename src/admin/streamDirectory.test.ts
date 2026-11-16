import { describe, expect, it } from 'vitest';
import { parseDirectory, searchDirectory } from './streamDirectory';

const raw = [
  { channel: 'Kan11.il', title: 'Kan 11', quality: '720p', url: 'https://a.example/kan.m3u8' },
  { channel: null, title: 'BBC News', url: 'https://a.example/bbc.m3u8' },
  { channel: 'Old.tv', title: 'Insecure', url: 'http://a.example/old.m3u8' },
  { title: 'No address' },
  'garbage',
];

describe('parseDirectory', () => {
  it('keeps https streams and fills missing text with empty strings', () => {
    expect(parseDirectory(raw)).toEqual([
      { channel: 'Kan11.il', title: 'Kan 11', quality: '720p', url: 'https://a.example/kan.m3u8' },
      { channel: '', title: 'BBC News', quality: '', url: 'https://a.example/bbc.m3u8' },
    ]);
  });

  it('returns nothing for unexpected data', () => {
    expect(parseDirectory({ streams: raw })).toEqual([]);
  });
});

describe('searchDirectory', () => {
  const streams = parseDirectory(raw);

  it('matches channel id or title, ignoring case', () => {
    expect(searchDirectory(streams, 'kan11')).toHaveLength(1);
    expect(searchDirectory(streams, ' bbc ')).toHaveLength(1);
  });

  it('returns nothing for an empty query', () => {
    expect(searchDirectory(streams, '  ')).toEqual([]);
  });
});
