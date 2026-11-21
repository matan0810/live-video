import { describe, expect, it } from 'vitest';
import { trackLabel, uniqueByLabel } from './captionOptions';

const fallback = (n: number) => `Track ${n}`;

describe('trackLabel', () => {
  it('prefers the name, then the language, then a number', () => {
    expect(trackLabel('English', 'en', 0, fallback)).toBe('English');
    expect(trackLabel(' ', 'de', 0, fallback)).toBe('German');
    expect(trackLabel(undefined, undefined, 2, fallback)).toBe('Track 3');
  });

  it('turns language codes into names in the site language', () => {
    expect(trackLabel('eng', undefined, 0, fallback, 'en')).toBe('English');
    expect(trackLabel(undefined, 'de', 0, fallback, 'he')).toBe('גרמנית');
    expect(trackLabel('CC1', undefined, 0, fallback, 'en')).toBe('CC1');
  });
});

describe('uniqueByLabel', () => {
  it('keeps the first of tracks with the same label', () => {
    expect(
      uniqueByLabel([
        { id: 'sub-0', label: 'English' },
        { id: 'sub-1', label: 'english' },
        { id: 'cc-0', label: 'CC1' },
      ]),
    ).toEqual([
      { id: 'sub-0', label: 'English' },
      { id: 'cc-0', label: 'CC1' },
    ]);
  });
});
