import { describe, expect, it } from 'vitest';
import {
  countChanges,
  draftsToChannels,
  moveDraft,
  toDraft,
  withoutSource,
  withPrimarySource,
} from './drafts';

const channel = (id: string, sources = [`https://a.example/${id}.m3u8`]) => ({
  id,
  name: id.toUpperCase(),
  short: id,
  group: 'world' as const,
  sources,
});

describe('drafts', () => {
  it('round-trips channels through drafts', () => {
    const channels = [
      channel('one'),
      {
        ...channel('two', ['https://a.example/1', 'https://b.example/2']),
        nameEn: 'Two',
        logo: 'https://a.example/two.svg',
        language: 'ar' as const,
        limits: ['no-sound' as const, 'low-quality' as const],
      },
    ];
    expect(draftsToChannels(channels.map(toDraft))).toEqual(channels);
  });

  it('ignores blank lines and surrounding spaces in sources', () => {
    const draft = { ...toDraft(channel('one')), sourcesText: '\n  https://a.example/x  \n\n' };
    expect(draftsToChannels([draft])[0]?.sources).toEqual(['https://a.example/x']);
  });

  it('reports invalid drafts', () => {
    const draft = { ...toDraft(channel('one')), sourcesText: 'http://insecure.example/a.m3u8' };
    expect(() => draftsToChannels([draft])).toThrow(/source/);
  });

  it('puts a suggested link first without duplicating it', () => {
    const drafts = [toDraft(channel('one', ['https://a.example/old', 'https://a.example/new']))];
    const updated = withPrimarySource(drafts, 'one', 'https://a.example/new');
    expect(updated[0]?.sourcesText).toBe('https://a.example/new\nhttps://a.example/old');
  });

  it('moves a draft and leaves the list alone at the edges', () => {
    const drafts = ['a', 'b', 'c'].map((id) => toDraft(channel(id)));
    const ids = (list: typeof drafts) => list.map((draft) => draft.id);
    const [first, , last] = drafts;
    expect(ids(moveDraft(drafts, first?.key ?? '', 1))).toEqual(['b', 'a', 'c']);
    expect(ids(moveDraft(drafts, first?.key ?? '', -1))).toEqual(['a', 'b', 'c']);
    expect(ids(moveDraft(drafts, last?.key ?? '', 1))).toEqual(['a', 'b', 'c']);
  });

  describe('countChanges', () => {
    const saved = ['a', 'b', 'c'].map((id) => toDraft(channel(id)));
    const [first, ...rest] = saved;
    if (!first) throw new Error('the sample list is empty');

    it('is zero for the list as saved', () => {
      expect(countChanges(saved, [...saved])).toBe(0);
    });

    it('counts an edited channel once, however many fields changed', () => {
      const edited = { ...first, name: 'Other', short: 'x', sourcesText: 'https://a.example/x' };
      expect(countChanges(saved, [edited, ...rest])).toBe(1);
    });

    it('counts a channel added and one removed', () => {
      const added = toDraft(channel('d'));
      expect(countChanges(saved, [...saved, added])).toBe(1);
      expect(countChanges(saved, saved.slice(1))).toBe(1);
    });

    it('counts a changed order as one change', () => {
      expect(countChanges(saved, moveDraft(saved, first.key, 1))).toBe(1);
    });

    it('is zero again once an edit is put back', () => {
      const edited = { ...first, name: 'Other' };
      expect(countChanges(saved, [{ ...edited, name: first.name }, ...rest])).toBe(0);
    });
  });

  describe('withoutSource', () => {
    const draft = toDraft(channel('one', ['https://a.example/1', 'https://b.example/2']));

    it('drops that link and keeps the others in their order', () => {
      expect(withoutSource(draft, 'https://a.example/1').sourcesText).toBe('https://b.example/2');
      expect(withoutSource(draft, 'https://b.example/2').sourcesText).toBe('https://a.example/1');
    });

    it('changes nothing for a link the channel does not have', () => {
      expect(withoutSource(draft, 'https://c.example/3')).toEqual(draft);
    });

    it('can take the last link, leaving the channel with none', () => {
      const only = toDraft(channel('two', ['https://a.example/1']));
      expect(withoutSource(only, 'https://a.example/1').sourcesText).toBe('');
    });
  });
});
