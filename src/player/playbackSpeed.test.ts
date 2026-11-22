import { describe, expect, it } from 'vitest';
import { isSpeedAllowed, speedAfterCatchingUp } from './playbackSpeed';

describe('playback speed on a live stream', () => {
  it('offers faster speeds only while behind live', () => {
    expect(isSpeedAllowed(1.5, true)).toBe(false);
    expect(isSpeedAllowed(1.5, false)).toBe(true);
    expect(isSpeedAllowed(0.75, true)).toBe(true);
  });

  it('returns to normal once a faster speed reaches live', () => {
    expect(speedAfterCatchingUp(2, true)).toBe(1);
    expect(speedAfterCatchingUp(2, false)).toBe(2);
    expect(speedAfterCatchingUp(0.5, true)).toBe(0.5);
  });
});
