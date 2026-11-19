import { describe, expect, it } from 'vitest';
import { languageBadge } from './languageBadge';

const base = { id: 'x', name: 'X', short: 'X', sources: ['https://a.example/x.m3u8'] };

describe('languageBadge', () => {
  it('marks a channel whose language differs from its group', () => {
    expect(languageBadge({ ...base, group: 'israel', language: 'ar' })).toBe('AR');
    expect(languageBadge({ ...base, group: 'languages', language: 'fr' })).toBe('FR');
  });

  it('leaves channels in their group language unmarked', () => {
    expect(languageBadge({ ...base, group: 'israel', language: 'he' })).toBeNull();
    expect(languageBadge({ ...base, group: 'arabic', language: 'ar' })).toBeNull();
  });

  it('leaves channels without a group or language unmarked', () => {
    expect(languageBadge({ ...base, language: 'fr' })).toBeNull();
    expect(languageBadge({ ...base, group: 'world' })).toBeNull();
  });
});
