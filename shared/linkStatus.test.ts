import { describe, expect, it } from 'vitest';
import {
  acknowledgeLimits,
  LIMITATIONS,
  parseLinkStatus,
  type SourceResult,
} from './linkStatus.ts';

const run = {
  checkedAt: '2026-11-22T04:17:00.000Z',
  from: 'הרשימה שבניהול',
  channels: [
    {
      id: 'dw',
      name: 'DW',
      sources: [{ url: 'https://dw.example/a.m3u8', state: 'ok', detail: 'OK', problems: [] }],
    },
    { id: 'n12', name: 'N12', sources: [] },
  ],
};

describe('parseLinkStatus', () => {
  it('reads a stored run', () => {
    expect(parseLinkStatus(run)).toEqual(run);
  });

  it('refuses anything that is not a run', () => {
    expect(parseLinkStatus(null)).toBeNull();
    expect(parseLinkStatus({ ...run, checkedAt: 'yesterday' })).toBeNull();
    expect(parseLinkStatus({ ...run, channels: 'all' })).toBeNull();
  });

  it('refuses unknown states and problems instead of showing them', () => {
    const withState = (state: string, problems: string[] = []) => ({
      ...run,
      channels: [{ id: 'a', name: 'A', sources: [{ url: 'x', state, detail: '', problems }] }],
    });
    expect(parseLinkStatus(withState('exploded'))).toBeNull();
    expect(parseLinkStatus(withState('problems', ['haunted']))).toBeNull();
    expect(parseLinkStatus(withState('problems', ['no-audio']))).not.toBeNull();
  });

  it('refuses oversized text', () => {
    expect(parseLinkStatus({ ...run, from: 'x'.repeat(501) })).toBeNull();
  });
});

describe('acknowledgeLimits', () => {
  const answering = (problems: SourceResult['problems']): SourceResult => ({
    url: 'https://a.example/a.m3u8',
    state: 'problems',
    detail: 'OK',
    problems,
  });

  it('counts a silent stream as watchable when the channel is tagged "no sound"', () => {
    expect(acknowledgeLimits(answering(['no-audio']), ['no-sound']).state).toBe('limited');
  });

  it('keeps the problems, so the owner is still told what they are', () => {
    expect(acknowledgeLimits(answering(['no-audio']), ['no-sound']).problems).toEqual(['no-audio']);
  });

  it('does not forgive what the tags do not name', () => {
    expect(acknowledgeLimits(answering(['no-audio']), []).state).toBe('problems');
    expect(acknowledgeLimits(answering(['no-audio', 'recording']), ['no-sound']).state).toBe(
      'problems',
    );
    expect(acknowledgeLimits(answering(['blocks-site']), ['no-sound']).state).toBe('problems');
  });

  it('leaves links that work, or are down, alone', () => {
    const down: SourceResult = { ...answering([]), state: 'down' };
    expect(acknowledgeLimits(down, ['no-sound'])).toEqual(down);
    const ok: SourceResult = { ...answering([]), state: 'ok' };
    expect(acknowledgeLimits(ok, ['no-sound'])).toEqual(ok);
  });

  it('treats a picture that is blurry but watchable as a limitation, not a failure', () => {
    expect(LIMITATIONS).toContain('low-quality');
    expect(LIMITATIONS).toContain('hevc-only');
    expect(LIMITATIONS).not.toContain('no-audio');
  });
});
