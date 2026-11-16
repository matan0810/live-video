import { describe, expect, it } from 'vitest';
import { draftsToChannels, moveDraft, toDraft, withPrimarySource } from './drafts';

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
      channel('two', ['https://a.example/1', 'https://b.example/2']),
    ];
    expect(draftsToChannels(channels.map(toDraft))).toEqual(channels);
  });

  it('ignores blank lines and surrounding spaces in sources', () => {
    const draft = { ...toDraft(channel('one')), sourcesText: '\n  https://a.example/x  \n\n' };
    expect(draftsToChannels([draft])[0]?.sources).toEqual(['https://a.example/x']);
  });

  it('reports invalid drafts', () => {
    const draft = { ...toDraft(channel('one')), sourcesText: '' };
    expect(() => draftsToChannels([draft])).toThrow(/sources/);
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
});
