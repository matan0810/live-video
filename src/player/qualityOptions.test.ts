import { describe, expect, it } from 'vitest';
import { qualityOptions } from './qualityOptions';

describe('qualityOptions', () => {
  it('lists each height once, highest first, with its best level', () => {
    expect(
      qualityOptions([
        { height: 360, bitrate: 800_000 },
        { height: 1080, bitrate: 5_000_000 },
        { height: 720, bitrate: 2_500_000 },
        { height: 720, bitrate: 3_000_000 },
      ]),
    ).toEqual([
      { height: 1080, levelIndex: 1 },
      { height: 720, levelIndex: 3 },
      { height: 360, levelIndex: 0 },
    ]);
  });

  it('leaves out levels with no known height', () => {
    expect(qualityOptions([{ bitrate: 128_000 }, { height: 0, bitrate: 1 }])).toEqual([]);
  });
});
