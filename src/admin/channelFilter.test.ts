import { describe, expect, it } from 'vitest';
import { filterDrafts } from './channelFilter';
import { toDraft, type DraftChannel } from './drafts';

const make = (id: string, name: string, group: DraftChannel['group'], nameEn = '') =>
  ({ ...toDraft({ id, name, short: id, group, sources: [] }), nameEn }) satisfies DraftChannel;

const drafts = [
  make('kan11', 'כאן 11', 'israel', 'Kan 11'),
  make('cnn', 'CNN', 'world'),
  make('radio-galgalatz', 'גלגלצ', 'radio-national'),
  make('radio-lbc', 'LBC', 'radio-world'),
];
const ids = (list: readonly DraftChannel[]) => list.map((draft) => draft.id);
const bad = (draft: DraftChannel) => draft.id === 'cnn';

describe('filterDrafts', () => {
  it('keeps everything for an empty query and "all"', () => {
    expect(filterDrafts(drafts, { query: '', kind: 'all' }, bad)).toHaveLength(4);
  });

  it('finds a channel by either name, the short label or the id, ignoring spaces and case', () => {
    expect(ids(filterDrafts(drafts, { query: 'kan 11', kind: 'all' }, bad))).toEqual(['kan11']);
    expect(ids(filterDrafts(drafts, { query: 'גלגל', kind: 'all' }, bad))).toEqual([
      'radio-galgalatz',
    ]);
    expect(ids(filterDrafts(drafts, { query: 'RADIO-L', kind: 'all' }, bad))).toEqual([
      'radio-lbc',
    ]);
  });

  it('separates TV from radio', () => {
    expect(ids(filterDrafts(drafts, { query: '', kind: 'tv' }, bad))).toEqual(['kan11', 'cnn']);
    expect(ids(filterDrafts(drafts, { query: '', kind: 'radio' }, bad))).toEqual([
      'radio-galgalatz',
      'radio-lbc',
    ]);
  });

  it('lists only the channels with a problem', () => {
    expect(ids(filterDrafts(drafts, { query: '', kind: 'problems' }, bad))).toEqual(['cnn']);
  });

  it('combines a query with a type', () => {
    expect(filterDrafts(drafts, { query: 'lbc', kind: 'tv' }, bad)).toEqual([]);
  });
});
