import { describe, expect, it } from 'vitest';
import { parseDirectoryChannels, streamsForSite } from './siteDirectory';

const channels = parseDirectoryChannels([
  { id: 'Kan11.il', name: 'Kan 11', website: 'https://www.kan.org.il/' },
  { id: 'Other.il', name: 'Other', website: 'https://other.example/' },
  { id: 'NoSite.il', name: 'No site', website: null },
  'garbage',
]);
const streams = [
  { channel: 'Kan11.il', title: 'Kan 11', quality: '1080p', url: 'https://a.example/kan.m3u8' },
  { channel: 'Other.il', title: 'Other', quality: '', url: 'https://a.example/other.m3u8' },
];

describe('parseDirectoryChannels', () => {
  it('keeps channels that name a website', () => {
    expect(channels.map((channel) => channel.id)).toEqual(['Kan11.il', 'Other.il']);
  });
});

describe('streamsForSite', () => {
  it('matches the site with or without www', () => {
    expect(streamsForSite('https://kan.org.il/live/', channels, streams)).toEqual([streams[0]]);
    expect(streamsForSite('https://www.kan.org.il/x', channels, streams)).toEqual([streams[0]]);
  });

  it('does not match other sites or bad addresses', () => {
    expect(streamsForSite('https://kan.org.il.evil.example/', channels, streams)).toEqual([]);
    expect(streamsForSite('not a url', channels, streams)).toEqual([]);
  });
});
