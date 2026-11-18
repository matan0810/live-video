import { describe, expect, it } from 'vitest';
import { defaultLanguage, isLanguage, STRINGS } from './strings';

describe('defaultLanguage', () => {
  it.each([
    [['he-IL', 'en-US'], 'he'],
    [['en-US', 'he'], 'he'],
    [['iw'], 'en'],
    [['en-GB'], 'en'],
    [[], 'en'],
  ])('%j → %s', (languages, expected) => {
    expect(defaultLanguage(languages)).toBe(expected);
  });
});

describe('isLanguage', () => {
  it('accepts only supported languages', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });
});

describe('STRINGS', () => {
  it('has the same keys in every language', () => {
    expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.he).sort());
  });
});
