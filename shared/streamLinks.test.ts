import { describe, expect, it } from 'vitest';
import {
  findIframes,
  findStreamLinks,
  isStreamRequest,
  isTemporaryLink,
  MAX_STREAM_LINKS,
} from './streamLinks';

const BASE = 'https://tv.example/live/';

describe('findStreamLinks', () => {
  it('finds absolute links in HTML and scripts, once each', () => {
    const html = `
      <video src="https://cdn.example/a/master.m3u8?token=1&amp;x=2"></video>
      <script>var cfg = {"hls":"https:\\/\\/cdn.example\\/b\\/index.m3u8"};</script>
      <script>player.load("https://cdn.example/a/master.m3u8?token=1&x=2")</script>`;
    expect(findStreamLinks(html, BASE)).toEqual([
      'https://cdn.example/a/master.m3u8?token=1&x=2',
      'https://cdn.example/b/index.m3u8',
    ]);
  });

  it('decodes \\u002F escapes', () => {
    expect(findStreamLinks('"https:\\u002F\\u002Fcdn.example\\u002Fc.m3u8"', BASE)).toEqual([
      'https://cdn.example/c.m3u8',
    ]);
  });

  it('resolves relative links against the page', () => {
    expect(findStreamLinks('<source src="../hls/live.m3u8">', BASE)).toEqual([
      'https://tv.example/hls/live.m3u8',
    ]);
  });

  it('ignores http links and pages without streams', () => {
    expect(findStreamLinks('"http://cdn.example/a.m3u8"', BASE)).toEqual([]);
    expect(findStreamLinks('<p>no video here</p>', BASE)).toEqual([]);
  });

  it(`reports at most ${MAX_STREAM_LINKS} links`, () => {
    const html = Array.from({ length: 50 }, (_, i) => `"https://cdn.example/${i}.m3u8"`).join(' ');
    expect(findStreamLinks(html, BASE)).toHaveLength(MAX_STREAM_LINKS);
  });
});

describe('findIframes', () => {
  it('finds https iframes, resolving relative ones', () => {
    const html = `<iframe src="/embed/player"></iframe><iframe width=1 src='https://p.example/x'>
      <iframe src="http://insecure.example/y"></iframe>`;
    expect(findIframes(html, BASE)).toEqual([
      'https://tv.example/embed/player',
      'https://p.example/x',
    ]);
  });
});

describe('isStreamRequest', () => {
  it.each([
    ['https://cdn.example/live/master.m3u8', true],
    ['https://cdn.example/live/index.m3u8?token=1', true],
    ['https://cdn.example/live/seg001.ts', false],
    ['https://cdn.example/m3u8-guide.html', false],
    ['http://cdn.example/live.m3u8', false],
  ])('%s → %s', (url, expected) => {
    expect(isStreamRequest(url)).toBe(expected);
  });
});

describe('isTemporaryLink', () => {
  it.each([
    ['https://cdn.example/live.m3u8', false],
    ['https://cdn.example/live.m3u8?quality=hd', false],
    ['https://a.akamaized.net/x/index.m3u8?hdnea=st%3D1~exp%3D2~hmac%3Dab', true],
    ['https://d1.cloudfront.net/x.m3u8?Policy=a&Signature=b&Key-Pair-Id=c', true],
    ['https://cdn.example/x.m3u8?token=abc&expires=123', true],
    ['https://a.akamaized.net/hdntl=exp=1~hmac=2/index.m3u8', true],
  ])('%s → %s', (url, expected) => {
    expect(isTemporaryLink(url)).toBe(expected);
  });
});
