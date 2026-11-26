import { describe, expect, it } from 'vitest';
import { parseExtractedLinks, parseRemoteChannels, parseReports, parseToken } from './responses';

const report = {
  id: 'r1',
  createdAt: '2026-11-26T08:00:00.000Z',
  channelId: 'dw',
  channelName: 'DW',
  reason: 'not-working',
};

describe('Worker answers', () => {
  it('reads a login token, and nothing else', () => {
    expect(parseToken({ token: 'abc.def' })).toBe('abc.def');
    expect(parseToken({ token: '' })).toBeNull();
    expect(parseToken({ token: 5 })).toBeNull();
  });

  it('keeps well-formed reports and leaves out broken ones', () => {
    expect(parseReports({ reports: [report, { ...report, reason: 'hacked' }, 7] })).toEqual([
      report,
    ]);
    expect(parseReports({ reports: 'x' })).toBeNull();
  });

  it('checks found links: https only, known sources', () => {
    const found = parseExtractedLinks({
      links: [
        { url: 'https://a.example/x.m3u8', source: 'page' },
        { url: 'http://a.example/y.m3u8', source: 'page' },
        { url: 'https://a.example/z.m3u8', source: 'magic' },
      ],
      pagesScanned: 2,
      browser: 'not-needed',
    });
    expect(found).toEqual({
      links: [{ url: 'https://a.example/x.m3u8', source: 'page' }],
      pagesScanned: 2,
      browser: 'not-needed',
    });
    expect(parseExtractedLinks({ links: [], pagesScanned: 1, browser: 'teleport' })).toBeNull();
  });

  it('passes the saved channel list on for the list rules to check', () => {
    expect(parseRemoteChannels({ channels: null, appVersion: '2.13.0' })).toEqual({
      channels: null,
      appVersion: '2.13.0',
    });
    expect(parseRemoteChannels('nope')).toBeNull();
  });
});
