import { describe, expect, it } from 'vitest';
import { dominantHue } from './logoTint';

/** RGBA pixels: `count` copies of each colour. */
function pixels(...colours: [r: number, g: number, b: number, a: number, count: number][]) {
  return colours.flatMap(([r, g, b, a, count]) =>
    Array.from({ length: count }, () => [r, g, b, a]).flat(),
  );
}

describe('dominantHue', () => {
  it('finds the hue of a single-colour logo', () => {
    expect(dominantHue(pixels([220, 30, 30, 255, 10]))).toBe(0);
    expect(dominantHue(pixels([30, 90, 220, 255, 10]))).toBe(221);
  });

  it('ignores white, black, grey and transparent pixels', () => {
    const logo = pixels(
      [255, 255, 255, 255, 50],
      [0, 0, 0, 255, 20],
      [128, 128, 128, 255, 20],
      [30, 200, 60, 0, 50],
      [30, 200, 60, 255, 10],
    );
    expect(dominantHue(logo)).toBe(131);
  });

  it('averages around the colour wheel', () => {
    const hue = dominantHue(pixels([255, 0, 40, 255, 5], [255, 40, 0, 255, 5]));
    expect(hue === 0 || hue === 360 || hue === 359).toBe(true);
  });

  it('returns null for black-and-white or empty logos', () => {
    expect(dominantHue(pixels([255, 255, 255, 255, 90], [0, 0, 0, 255, 10]))).toBeNull();
    expect(dominantHue([])).toBeNull();
  });
});
