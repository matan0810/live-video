import { describe, expect, it } from 'vitest';
import type { ChannelResult, SourceResult } from '../../shared/linkStatus';
import { groupByVerdict, isStale } from './statusBoard';

const source = (state: SourceResult['state']): SourceResult => ({
  url: 'https://x.example/a.m3u8',
  state,
  detail: state === 'down' ? 'HTTP 404' : 'OK',
  problems: state === 'problems' ? ['no-audio'] : [],
});
const channel = (id: string, ...states: SourceResult['state'][]): ChannelResult => ({
  id,
  name: id,
  sources: states.map(source),
});

describe('groupByVerdict', () => {
  it('puts what needs the owner first and leaves out empty groups', () => {
    const groups = groupByVerdict([
      channel('fine', 'ok'),
      channel('dead', 'down'),
      channel('backup-broken', 'ok', 'down'),
      channel('none'),
    ]);
    expect(groups.map((group) => [group.verdict, group.channels.map(({ id }) => id)])).toEqual([
      ['down', ['dead']],
      ['partial', ['backup-broken']],
      ['no-link', ['none']],
      ['ok', ['fine']],
    ]);
  });
});

describe('isStale', () => {
  const checkedAt = '2026-11-22T04:00:00.000Z';
  it('accepts a run from today and flags one from two days ago', () => {
    expect(isStale(checkedAt, Date.parse('2026-11-22T20:00:00.000Z'))).toBe(false);
    expect(isStale(checkedAt, Date.parse('2026-11-24T04:00:00.000Z'))).toBe(true);
  });
});
