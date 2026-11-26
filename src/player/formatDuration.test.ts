import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [9, '0:09'],
    [75, '1:15'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725.9, '1:02:05'],
    [-5, '0:00'],
    [Infinity, '0:00'],
    [NaN, '0:00'],
  ])('formats %d seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
