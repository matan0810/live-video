import { describe, expect, it } from 'vitest';
import type { Channel } from './index';
import { filterSections, matchesChannel, normalizeForSearch } from './searchChannels';

const channel = (id: string, name: string, nameEn?: string, short = id): Channel => ({
  id,
  name,
  short,
  sources: [],
  ...(nameEn ? { nameEn } : {}),
});
const kan = channel('kan11', 'כאן 11', 'Kan 11', '11');
const cnn = channel('cnn-international', 'CNN International', undefined, 'CNN');

describe('normalizeForSearch', () => {
  it('ignores case, spaces, accents and Hebrew vowel marks', () => {
    expect(normalizeForSearch('Kan 11')).toBe('kan11');
    expect(normalizeForSearch('Français')).toBe('francais');
    expect(normalizeForSearch('עַרוּץ')).toBe('ערוץ');
  });
});

describe('matchesChannel', () => {
  it('finds a channel by its Hebrew or English name, short label or id', () => {
    expect(matchesChannel(kan, 'כאן')).toBe(true);
    expect(matchesChannel(kan, 'kan11')).toBe(true);
    expect(matchesChannel(cnn, 'cnn')).toBe(true);
    expect(matchesChannel(cnn, 'international')).toBe(true);
    expect(matchesChannel(cnn, 'כאן')).toBe(false);
  });
});

describe('filterSections', () => {
  // A favourite is listed only under favourites (the page builds the sections that way).
  const sections = [
    { id: 'favorites', channels: [cnn] },
    { id: 'israel', channels: [kan] },
  ];

  it('keeps matching channels, favourites included, and drops empty sections', () => {
    expect(filterSections(sections, 'cnn')).toEqual([{ id: 'favorites', channels: [cnn] }]);
    expect(filterSections(sections, 'כאן')).toEqual([{ id: 'israel', channels: [kan] }]);
  });

  it('leaves everything as it is without a query', () => {
    expect(filterSections(sections, '  ')).toEqual(sections);
  });
});
