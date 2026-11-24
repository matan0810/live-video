import { describe, expect, it } from 'vitest';
import { isHlsSource, isStreamSource, resolveStreamUrl } from './sources';

const MAKO = 'mako:/stream/hls/live/2033791/k12n12wad/index.m3u8';

function fakeFetch(status: number, body: unknown): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe('isStreamSource', () => {
  it.each([
    ['https://example.com/live.m3u8', true],
    [MAKO, true],
    ['http://example.com/live.m3u8', false],
    ['mako:https://evil.example/x.m3u8', false],
    ['mako:/stream/hls/live/../../x', false],
    ['mako:/other/path.m3u8', false],
    [42, false],
  ])('%s → %s', (value, expected) => {
    expect(isStreamSource(value)).toBe(expected);
  });
});

describe('isHlsSource', () => {
  it.each([
    ['https://a.example/live/playlist.m3u8', true],
    ['https://kancdn.example/radio/kan_88/live.livx/playlist.m3u8?renditions&fmp4', true],
    ['https://a.example/LIVE.M3U8', true],
    [MAKO, true],
    ['https://eco01.livecdn.biz/ecolive/99fm_aac/icecast.audio', false],
    ['https://npr-ice.streamguys1.com/live.mp3', false],
    ['https://a.example/m3u8/stream', false],
    ['https://a.example/x.mp3?file=.m3u8', false],
  ])('%s → %s', (value, expected) => {
    expect(isHlsSource(value)).toBe(expected);
  });
});

describe('resolveStreamUrl', () => {
  it('returns https sources unchanged', async () => {
    await expect(resolveStreamUrl('https://a.example/x.m3u8')).resolves.toBe(
      'https://a.example/x.m3u8',
    );
  });

  it('adds a fresh ticket to mako sources', async () => {
    const fetcher = fakeFetch(200, { tickets: [{ ticket: 'hdnea=st%3D1~exp%3D2' }] });
    await expect(resolveStreamUrl(MAKO, fetcher)).resolves.toBe(
      'https://mako-streaming.akamaized.net/stream/hls/live/2033791/k12n12wad/index.m3u8?hdnea=st%3D1~exp%3D2',
    );
  });

  it.each([
    ['an HTTP error', fakeFetch(500, {})],
    ['a response without tickets', fakeFetch(200, { status: 'Success' })],
    ['an empty ticket', fakeFetch(200, { tickets: [{ ticket: '' }] })],
  ])('fails on %s', async (_label, fetcher) => {
    await expect(resolveStreamUrl(MAKO, fetcher)).rejects.toThrow();
  });
});
