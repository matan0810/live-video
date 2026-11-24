import { describe, expect, it } from 'vitest';
import { minutesLeft } from './sleepTimer';

describe('minutesLeft', () => {
  it('rounds up, and never says zero while running', () => {
    expect(minutesLeft(30 * 60_000, 0)).toBe(30);
    expect(minutesLeft(30 * 60_000, 60_001)).toBe(29);
    expect(minutesLeft(1000, 999)).toBe(1);
    expect(minutesLeft(1000, 5000)).toBe(1);
  });
});
