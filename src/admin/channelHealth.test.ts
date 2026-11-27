import { describe, expect, it } from 'vitest';
import type { LinkStatus, SourceResult } from '../../shared/linkStatus';
import { healthOf, isProblem, linkStates } from './channelHealth';
import { toDraft } from './drafts';
import type { StreamCheckState } from './useStreamChecks';
import type { ChannelLimit } from '../../shared/channels/types';

const draft = (sources: string[], limits: ChannelLimit[] = []) =>
  toDraft({ id: 'demo', name: 'Demo', short: 'D', group: 'world', sources, limits });
const source = (
  url: string,
  state: SourceResult['state'],
  problems: SourceResult['problems'] = [],
): SourceResult => ({ url, state, detail: state === 'down' ? 'HTTP 404' : 'OK', problems });
const daily = (...sources: SourceResult[]): LinkStatus => ({
  checkedAt: '2026-11-27T10:00:00Z',
  from: 'הקוד',
  channels: [{ id: 'demo', name: 'Demo', sources }],
});
const none = new Map<string, StreamCheckState>();
const A = 'https://a.example/a.m3u8';
const B = 'https://b.example/b.m3u8';
const worked: StreamCheckState = { isWorking: true, detail: 'OK' };
const failed: StreamCheckState = { isWorking: false, detail: 'לא נטען' };

describe('healthOf', () => {
  it('says "no link" for a channel without one, whatever else is known', () => {
    expect(healthOf(draft([]), daily(source(A, 'ok')), none)).toEqual({
      tone: 'bad',
      text: 'בלי קישור',
    });
  });

  it('takes the daily check when it saw the same links', () => {
    expect(healthOf(draft([A]), daily(source(A, 'ok')), none)).toEqual({
      tone: 'good',
      text: 'תקין',
    });
    expect(healthOf(draft([A]), daily(source(A, 'down')), none)).toEqual({
      tone: 'bad',
      text: 'לא עובד',
    });
  });

  it('does not trust the daily check once the links were edited', () => {
    expect(healthOf(draft([B]), daily(source(A, 'ok')), none)).toEqual({
      tone: 'unknown',
      text: 'לא נבדק',
    });
  });

  it('is unknown while the daily check is loading or unavailable', () => {
    for (const status of [undefined, null, 'unavailable' as const]) {
      expect(healthOf(draft([A]), status, none).tone).toBe('unknown');
    }
  });

  it('says it is checking while a check runs', () => {
    expect(healthOf(draft([A]), null, new Map([[A, 'checking' as const]]))).toEqual({
      tone: 'unknown',
      text: 'בודק…',
    });
  });

  describe('a working first link', () => {
    it('is amber when only a backup is broken, and says which', () => {
      expect(healthOf(draft([A, B]), daily(source(A, 'ok'), source(B, 'down')), none)).toEqual({
        tone: 'warn',
        text: 'עובד, הגיבוי שבור',
      });
    });
  });

  describe('a broken first link', () => {
    it('is amber when a backup works, and says so', () => {
      expect(healthOf(draft([A, B]), daily(source(A, 'down'), source(B, 'ok')), none)).toEqual({
        tone: 'warn',
        text: 'הקישור הראשי שבור, הגיבוי עובד',
      });
    });

    it('is red when nothing works', () => {
      expect(healthOf(draft([A, B]), daily(source(A, 'down'), source(B, 'down')), none).tone).toBe(
        'bad',
      );
    });
  });

  describe('limits', () => {
    it('says what the limits are, in amber, never red', () => {
      const health = healthOf(
        draft([A], ['no-sound']),
        daily(source(A, 'limited', ['no-audio', 'low-quality'])),
        none,
      );
      expect(health).toEqual({ tone: 'warn', text: 'עובד עם הגבלות: בלי קול, איכות נמוכה מ-360p' });
    });

    it('does not call a channel broken because this browser cannot play its HEVC', () => {
      const checks = new Map([[A, failed]]);
      const health = healthOf(draft([A]), daily(source(A, 'limited', ['hevc-only'])), checks);
      expect(health.tone).toBe('warn');
    });
  });

  describe('a check just run here', () => {
    it('wins over the daily one when it works', () => {
      expect(healthOf(draft([A]), daily(source(A, 'down')), new Map([[A, worked]])).tone).toBe(
        'good',
      );
    });

    it('is amber, not red, when it fails here but the daily check found the link fine', () => {
      const health = healthOf(draft([A]), daily(source(A, 'ok')), new Map([[A, failed]]));
      expect(health).toEqual({ tone: 'warn', text: 'נכשל בבדיקה כאן, תקין בבדיקה היומית' });
    });

    it('is red when it fails here and nothing says otherwise', () => {
      expect(healthOf(draft([A]), null, new Map([[A, failed]])).tone).toBe('bad');
    });
  });
});

describe('isProblem', () => {
  it('flags amber and red, not green or grey', () => {
    expect(isProblem({ tone: 'bad', text: '' })).toBe(true);
    expect(isProblem({ tone: 'warn', text: '' })).toBe(true);
    expect(isProblem({ tone: 'good', text: '' })).toBe(false);
    expect(isProblem({ tone: 'unknown', text: '' })).toBe(false);
  });
});

describe('linkStates', () => {
  it('gives each link its own state, in the order of the channel', () => {
    const states = linkStates(draft([A, B]), daily(source(A, 'ok'), source(B, 'down')), none);
    expect(states.map((state) => [state.url, state.tone, state.text])).toEqual([
      [A, 'good', 'תקין'],
      [B, 'bad', 'לא עובד'],
    ]);
  });

  it('says which links are broken, so they can be removed', () => {
    const states = linkStates(draft([A, B]), daily(source(A, 'ok'), source(B, 'down')), none);
    expect(states.map((state) => state.isBroken)).toEqual([false, true]);
  });

  it('does not call a limited or unchecked link broken', () => {
    const states = linkStates(draft([A, B]), daily(source(A, 'limited', ['hevc-only'])), none);
    expect(states.map((state) => state.isBroken)).toEqual([false, false]);
  });
});
