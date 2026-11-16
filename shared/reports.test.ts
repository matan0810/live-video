import { describe, expect, it } from 'vitest';
import { parseReportInput, REPORT_LIMITS } from './reports';

const valid = { channelId: 'kan11', channelName: 'כאן 11', reason: 'not-working' };

describe('parseReportInput', () => {
  it('accepts a minimal report', () => {
    expect(parseReportInput(valid)).toEqual(valid);
  });

  it('keeps a note and a suggested link, and drops unknown fields', () => {
    const input = { ...valid, note: ' no sound ', suggestedUrl: 'https://a.example/x.m3u8', x: 1 };
    expect(parseReportInput(input)).toEqual({
      ...valid,
      note: 'no sound',
      suggestedUrl: 'https://a.example/x.m3u8',
    });
  });

  it('treats empty optional fields as absent', () => {
    expect(parseReportInput({ ...valid, note: '', suggestedUrl: '' })).toEqual(valid);
  });

  it('replaces control and text-reordering characters', () => {
    expect(parseReportInput({ ...valid, note: 'a\u202Eb\nc' })?.note).toBe('a b c');
  });

  it.each([
    ['a non-object', 'text'],
    ['a missing channel', { ...valid, channelId: undefined }],
    ['an unknown reason', { ...valid, reason: 'boring' }],
    ['a note that is too long', { ...valid, note: 'x'.repeat(REPORT_LIMITS.note + 1) }],
    ['a non-https link', { ...valid, suggestedUrl: 'http://a.example/x.m3u8' }],
    ['a script link', { ...valid, suggestedUrl: 'javascript:alert(1)' }],
  ])('rejects %s', (_label, data) => {
    expect(parseReportInput(data)).toBeNull();
  });
});
