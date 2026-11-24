/** A picture height the viewer can pick, and the hls.js level that plays it. */
export interface QualityOption {
  height: number;
  levelIndex: number;
}

/**
 * The heights a stream offers, highest first, one per height (the highest bitrate of each,
 * since a stream may list the same height twice). Levels without a known height are left
 * out: "Auto" still plays them.
 */
export function qualityOptions(
  levels: readonly { height?: number; bitrate: number }[],
): QualityOption[] {
  const best = new Map<number, { levelIndex: number; bitrate: number }>();
  levels.forEach(({ height, bitrate }, levelIndex) => {
    if (!height || height <= 0) return;
    const current = best.get(height);
    if (!current || bitrate > current.bitrate) best.set(height, { levelIndex, bitrate });
  });
  return [...best.entries()]
    .map(([height, { levelIndex }]) => ({ height, levelIndex }))
    .sort((a, b) => b.height - a.height);
}
