import { describe, expect, it } from 'vitest';
import { skipFeedback } from './seekFeedback';

describe('skipFeedback', () => {
  it('shows a ten-second skip either way, rounded to five seconds', () => {
    expect(skipFeedback(-9.7, null, 0)).toEqual({ direction: 'back', seconds: 10, at: 0 });
    expect(skipFeedback(10.2, null, 0)).toEqual({ direction: 'forward', seconds: 10, at: 0 });
  });

  it('adds up quick repeated skips in the same direction', () => {
    const first = skipFeedback(-10, null, 0);
    expect(skipFeedback(-10, first, 500)).toMatchObject({ seconds: 20 });
    expect(skipFeedback(-10, first, 3000)).toMatchObject({ seconds: 10 });
    expect(skipFeedback(10, first, 500)).toMatchObject({ direction: 'forward', seconds: 10 });
  });

  it('ignores small jumps and long ones such as the timeline or the jump to live', () => {
    expect(skipFeedback(0.5, null, 0)).toBeNull();
    expect(skipFeedback(-900, null, 0)).toBeNull();
  });
});
