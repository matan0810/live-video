import { describe, expect, it } from 'vitest';
import { STRINGS } from '../i18n/strings';
import { buildSections } from './buildSections';
import { bundledChannels, CHANNEL_GROUPS } from './index';

const t = STRINGS.he;
const own = { id: 'custom-1', name: 'שלי', short: 'שלי', sources: ['https://x.example/a.m3u8'] };

describe('buildSections', () => {
  it('lists the real channels by group, each once', () => {
    const sections = buildSections(bundledChannels, [], [], t);
    expect(sections.map((section) => section.id)).toEqual([...CHANNEL_GROUPS]);
    const ids = sections.flatMap((section) => section.channels.map(({ id }) => id));
    expect(new Set(ids).size).toBe(bundledChannels.length);
  });

  it('puts favourites first, then the viewer own channels, without repeating them', () => {
    const sections = buildSections(bundledChannels, [own], ['dw', 'custom-1'], t);
    expect(sections[0]?.channels.map(({ id }) => id)).toEqual(['dw', 'custom-1']);
    const ids = sections.flatMap((section) => section.channels.map(({ id }) => id));
    expect(ids.filter((id) => id === 'dw')).toHaveLength(1);
    expect(sections.some((section) => section.id === 'custom')).toBe(false);
  });
});
