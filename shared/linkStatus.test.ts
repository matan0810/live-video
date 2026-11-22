import { describe, expect, it } from 'vitest';
import { parseLinkStatus } from './linkStatus.ts';

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
