import { describe, expect, it } from 'vitest';
import { readPlaylistInfo } from './playlistInfo';

describe('readPlaylistInfo', () => {
  it('reads the best quality of a master playlist', () => {
    const master = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=690800,RESOLUTION=640x360
0/streamPlaylist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2890800,RESOLUTION=1280x720
1/streamPlaylist.m3u8`;
    expect(readPlaylistInfo(master)).toEqual({ maxHeight: 720, variants: 2, isLive: true });
  });

  it('handles a single-quality live playlist', () => {
    expect(readPlaylistInfo('#EXTM3U\n#EXTINF:6,\nseg1.ts')).toEqual({
      maxHeight: null,
      variants: 0,
      isLive: true,
    });
  });

  it('recognises a recording', () => {
    expect(readPlaylistInfo('#EXTM3U\n#EXTINF:6,\nseg1.ts\n#EXT-X-ENDLIST').isLive).toBe(false);
  });
});
