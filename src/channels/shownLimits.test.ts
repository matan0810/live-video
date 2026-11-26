import { describe, expect, it } from 'vitest';
import { shownLimits } from './shownLimits';

describe('shownLimits', () => {
  it('keeps the order of importance, whatever the order given', () => {
    expect(shownLimits(['low-quality', 'preview'], { canPlayHevc: true })).toEqual([
      'preview',
      'low-quality',
    ]);
  });

  it('mentions HEVC only in a browser that cannot play it', () => {
    expect(shownLimits(['hevc'], { canPlayHevc: true })).toEqual([]);
    expect(shownLimits(['hevc'], { canPlayHevc: false })).toEqual(['hevc']);
  });
});
