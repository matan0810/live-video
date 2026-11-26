import { describe, expect, it } from 'vitest';
import {
  levelDb,
  MAX_GAIN_DB,
  MIN_GAIN_DB,
  nextGainDb,
  smoothedLevel,
  STEP_DB,
  TARGET_DB,
} from './loudness';

describe('loudness levelling', () => {
  it('measures a block of samples in dB', () => {
    expect(levelDb(new Float32Array(64).fill(1))).toBeCloseTo(0);
    expect(levelDb(new Float32Array(64).fill(0.1))).toBeCloseTo(-20);
    expect(levelDb(new Float32Array(64))).toBe(-Infinity);
  });

  it('follows the level but ignores silence', () => {
    expect(smoothedLevel(null, -30)).toBe(-30);
    // Up quickly to louder speech, down slowly.
    expect(smoothedLevel(-30, -20)).toBeCloseTo(-27);
    expect(smoothedLevel(-20, -30)).toBeCloseTo(-20.5);
    expect(smoothedLevel(-30, -80)).toBe(-30);
    // A pause in speech does not drag the level down.
    expect(smoothedLevel(-28, -44)).toBe(-28);
    expect(smoothedLevel(null, -Infinity)).toBeNull();
  });

  it('moves the gain one step at a time towards the target', () => {
    // A loud channel (i24 once measured about -14 dB) is turned down, step by step.
    expect(nextGainDb(0, -14)).toBe(-STEP_DB);
    // A quiet one is turned up; a typical one stays.
    expect(nextGainDb(0, -36)).toBe(STEP_DB);
    expect(nextGainDb(0, TARGET_DB)).toBe(0);
    // At the target nothing changes; with no level known yet, neither.
    expect(nextGainDb(-2, TARGET_DB + 2)).toBe(-2);
    expect(nextGainDb(3, null)).toBe(3);
  });

  it('never goes beyond its limits', () => {
    let gain = 0;
    for (let i = 0; i < 80; i++) gain = nextGainDb(gain, -70 + 21);
    expect(gain).toBe(MAX_GAIN_DB);
    for (let i = 0; i < 80; i++) gain = nextGainDb(gain, 0);
    expect(gain).toBe(MIN_GAIN_DB);
  });
});
