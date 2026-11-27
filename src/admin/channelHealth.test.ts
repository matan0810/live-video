import { describe, expect, it } from 'vitest';
import type { LinkStatus, SourceResult } from '../../shared/linkStatus';
import { healthOf, isProblem } from './channelHealth';
import { toDraft } from './drafts';
import type { StreamCheckState } from './useStreamChecks';

const draft = (sources: string[]) =>
  toDraft({ id: 'demo', name: 'Demo', short: 'D', group: 'world', sources });
const source = (url: string, state: SourceResult['state']): SourceResult => ({
  url,
  state,
  detail: state === 'down' ? 'HTTP 404' : 'OK',
  problems: [],
});
const daily = (...sources: SourceResult[]): LinkStatus => ({
  checkedAt: '2026-11-27T10:00:00Z',
  from: 'הקוד',
  channels: [{ id: 'demo', name: 'Demo', sources }],
});
const none = new Map<string, StreamCheckState>();
const A = 'https://a.example/a.m3u8';
const B = 'https://b.example/b.m3u8';

describe('healthOf', () => {
  it('says "no link" for a channel without one, whatever else is known', () => {
    expect(healthOf(draft([]), daily(source(A, 'ok')), none)).toMatchObject({
      tone: 'bad',
      text: 'בלי קישור',
    });
  });

  it('takes the daily check when it saw the same links', () => {
    expect(healthOf(draft([A]), daily(source(A, 'ok')), none)).toMatchObject({ tone: 'good' });
    expect(healthOf(draft([A]), daily(source(A, 'down')), none)).toMatchObject({ tone: 'bad' });
    expect(healthOf(draft([A, B]), daily(source(A, 'ok'), source(B, 'down')), none)).toMatchObject({
      tone: 'warn',
    });
  });

  it('does not trust the daily check once the links were edited', () => {
    expect(healthOf(draft([B]), daily(source(A, 'ok')), none)).toMatchObject({
      tone: 'unknown',
      text: 'לא נבדק',
    });
  });

  it('prefers a check just run over the daily one', () => {
    const checks = new Map<string, StreamCheckState>([[A, { isWorking: true, detail: 'OK' }]]);
    expect(healthOf(draft([A]), daily(source(A, 'down')), checks)).toMatchObject({ tone: 'good' });
  });

  it('says it is checking while a check runs', () => {
    const checks = new Map<string, StreamCheckState>([[A, 'checking']]);
    expect(healthOf(draft([A]), null, checks)).toMatchObject({ tone: 'unknown', text: 'בודק…' });
  });

  it('is unknown while the daily check is loading or unavailable', () => {
    for (const status of [undefined, null, 'unavailable' as const]) {
      expect(healthOf(draft([A]), status, none)).toMatchObject({ tone: 'unknown' });
    }
  });
});

describe('isProblem', () => {
  it('flags a broken or partly broken channel, not a good or unknown one', () => {
    expect(isProblem({ tone: 'bad', text: '' })).toBe(true);
    expect(isProblem({ tone: 'warn', text: '' })).toBe(true);
    expect(isProblem({ tone: 'good', text: '' })).toBe(false);
    expect(isProblem({ tone: 'unknown', text: '' })).toBe(false);
  });
});
