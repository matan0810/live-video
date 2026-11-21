import { describe, expect, it } from 'vitest';
import { scrollRoom } from './useStripScroll';

describe('scrollRoom', () => {
  it('reads both reading directions', () => {
    expect(scrollRoom({ scrollLeft: 0, scrollWidth: 1000, clientWidth: 400 })).toEqual({
      hasBefore: false,
      hasAfter: true,
    });
    // Right to left: scrolled toward the end means a negative scrollLeft.
    expect(scrollRoom({ scrollLeft: -600, scrollWidth: 1000, clientWidth: 400 })).toEqual({
      hasBefore: true,
      hasAfter: false,
    });
    expect(scrollRoom({ scrollLeft: 300, scrollWidth: 1000, clientWidth: 400 })).toEqual({
      hasBefore: true,
      hasAfter: true,
    });
  });

  it('has no room when everything fits', () => {
    expect(scrollRoom({ scrollLeft: 0, scrollWidth: 400, clientWidth: 400 })).toEqual({
      hasBefore: false,
      hasAfter: false,
    });
  });
});
