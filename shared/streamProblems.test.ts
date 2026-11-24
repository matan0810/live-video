import { describe, expect, it } from 'vitest';
import { findStreamProblems, isAudioContentType } from './streamProblems';

const SITE = 'https://site.example';
const master = (...variants: string[]) =>
  ['#EXTM3U', ...variants.flatMap((attrs, i) => [`#EXT-X-STREAM-INF:${attrs}`, `${i}.m3u8`])].join(
    '\n',
  );

describe('findStreamProblems', () => {
  it('finds nothing wrong with a normal stream', () => {
    const playlist = master(
      'BANDWIDTH=1,RESOLUTION=640x360,CODECS="avc1.4d401f,mp4a.40.2"',
      'BANDWIDTH=2,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"',
    );
    expect(findStreamProblems(playlist, '*', SITE)).toEqual([]);
    expect(findStreamProblems(playlist, SITE, SITE)).toEqual([]);
  });

  it('spots a silent, tiny preview stream', () => {
    const playlist = master('BANDWIDTH=1,RESOLUTION=256x144,CODECS="avc1.42c020"');
    expect(findStreamProblems(playlist, '*', SITE)).toEqual(['no-audio', 'low-quality']);
  });

  it('accepts audio carried in a separate track', () => {
    const playlist = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",URI="a.m3u8"\n${master(
      'BANDWIDTH=1,RESOLUTION=1280x720,CODECS="avc1.640028",AUDIO="a"',
    )}`;
    expect(findStreamProblems(playlist, '*', SITE)).toEqual([]);
  });

  it('does not guess when codecs are not listed', () => {
    expect(findStreamProblems(master('BANDWIDTH=1,RESOLUTION=1280x720'), '*', SITE)).toEqual([]);
  });

  it('spots HEVC-only streams, recordings and servers that refuse the site', () => {
    const hevc = master('BANDWIDTH=1,RESOLUTION=1920x1080,CODECS="hvc1.2.4.L123.B0,mp4a.40.2"');
    expect(findStreamProblems(hevc, '*', SITE)).toEqual(['hevc-only']);
    expect(findStreamProblems('#EXTM3U\n#EXTINF:6,\na.ts\n#EXT-X-ENDLIST', '*', SITE)).toEqual([
      'recording',
    ]);
    expect(findStreamProblems('#EXTM3U\n#EXTINF:6,\na.ts', null, SITE)).toEqual(['blocks-site']);
    expect(findStreamProblems('#EXTM3U\n#EXTINF:6,\na.ts', 'https://other.example', SITE)).toEqual([
      'blocks-site',
    ]);
  });
});

describe('isAudioContentType', () => {
  it.each([
    ['audio/mpeg', true],
    ['audio/aacp; charset=utf-8', true],
    [' application/ogg', true],
    ['text/html; charset=utf-8', false],
    ['application/vnd.apple.mpegurl', false],
    ['', false],
  ])('%s → %s', (type, expected) => {
    expect(isAudioContentType(type)).toBe(expected);
  });
});

describe('an audio-only HLS playlist (radio)', () => {
  it('is not judged on picture height or sound', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"',
      'audio.m3u8',
    ].join('\n');
    expect(findStreamProblems(playlist, '*', 'https://site.example')).toEqual([]);
  });
});
