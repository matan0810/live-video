/** Pixels must be at least this saturated, and neither near-white nor near-black, to count. */
const MIN_SATURATION = 0.25;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.9;
/** Below this share of coloured pixels the logo is treated as black and white. */
const MIN_COLOURED_SHARE = 0.03;

function toHsl(r: number, g: number, b: number) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const sector =
    max === rn
      ? ((gn - bn) / delta) % 6
      : max === gn
        ? (bn - rn) / delta + 2
        : (rn - gn) / delta + 4;
  return { hue: (sector * 60 + 360) % 360, saturation, lightness };
}

/**
 * The dominant hue of a logo, from its RGBA pixels, or null for a logo that is mostly
 * black, white or grey. Hues are averaged on the colour wheel (so red at 350° and 10°
 * average to red, not cyan), weighted by saturation.
 */
export function dominantHue(pixels: ArrayLike<number>): number | null {
  let x = 0;
  let y = 0;
  let coloured = 0;
  let opaque = 0;
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    if (alpha < 128) continue;
    opaque += 1;
    const { hue, saturation, lightness } = toHsl(
      pixels[index] ?? 0,
      pixels[index + 1] ?? 0,
      pixels[index + 2] ?? 0,
    );
    if (saturation < MIN_SATURATION || lightness < MIN_LIGHTNESS || lightness > MAX_LIGHTNESS) {
      continue;
    }
    coloured += 1;
    const radians = (hue * Math.PI) / 180;
    x += Math.cos(radians) * saturation;
    y += Math.sin(radians) * saturation;
  }
  if (opaque === 0 || coloured / opaque < MIN_COLOURED_SHARE) return null;
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}
