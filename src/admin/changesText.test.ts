import { describe, expect, it } from 'vitest';
import { changesText } from './changesText';

describe('changesText', () => {
  it.each([
    [1, 'שינוי אחד'],
    [2, '2 שינויים'],
    [14, '14 שינויים'],
  ])('says %i as "%s"', (count, text) => {
    expect(changesText(count)).toBe(text);
  });
});
