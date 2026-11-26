/**
 * Levelling loudness between channels: a channel's measured level is moved gently towards
 * one target, so switching from a quiet channel to a loud one does not jump in volume.
 * Levels are in dB of the signal's RMS (0 dB is full scale).
 */
/** Where most news channels sit (measured across the list): a typical one stays as it is. */
export const TARGET_DB = -27;
/** Quieter than this is silence or a pause in speech: it says nothing about the level. */
export const SILENCE_DB = -50;
/** How far the gain may go: enough for a quiet channel, never wild. */
export const MIN_GAIN_DB = -12;
export const MAX_GAIN_DB = 9;
/**
 * How much the gain may change per step (four steps a second), so it settles within a few
 * seconds of a switch and never pumps audibly with the content.
 */
export const STEP_DB = 0.5;

/** The RMS level of a block of samples, in dB. */
export function levelDb(samples: Float32Array): number {
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  const rms = Math.sqrt(sum / Math.max(1, samples.length));
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/** Moments this far below the running level are pauses in speech, not the channel's level. */
export const PAUSE_GAP_DB = 12;

/**
 * A running level of the speech, skipping silence and pauses: it rises quickly to louder
 * moments and falls back slowly, as a level meter does, so a quiet first moment after a
 * switch does not pass for the channel's level.
 */
export function smoothedLevel(previous: number | null, measured: number) {
  if (!Number.isFinite(measured) || measured < SILENCE_DB) return previous;
  if (previous === null) return measured;
  if (measured < previous - PAUSE_GAP_DB) return previous;
  const weight = measured > previous ? 0.3 : 0.05;
  return previous + (measured - previous) * weight;
}

/** The next gain: one step towards bringing the level to the target, within the limits. */
export function nextGainDb(currentGainDb: number, levelDbBeforeGain: number | null): number {
  if (levelDbBeforeGain === null) return currentGainDb;
  const wanted = Math.min(MAX_GAIN_DB, Math.max(MIN_GAIN_DB, TARGET_DB - levelDbBeforeGain));
  const change = Math.max(-STEP_DB, Math.min(STEP_DB, wanted - currentGainDb));
  return currentGainDb + change;
}
