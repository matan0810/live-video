import { describe, expect, it } from 'vitest';
import { readChannelParam, withChannelParam } from './channelLink';

describe('readChannelParam', () => {
  it.each([
    ['?ch=kan11', 'kan11'],
    ['?foo=1&ch=bbc-news', 'bbc-news'],
    ['', null],
    ['?ch=', null],
  ])('reads "%s" as %s', (search, expected) => {
    expect(readChannelParam(search)).toBe(expected);
  });
});

describe('withChannelParam', () => {
  const base = 'https://example.com/live-video/';

  it('sets the channel', () => {
    expect(withChannelParam(base, 'kan11')).toBe(`${base}?ch=kan11`);
  });

  it('replaces an existing channel and keeps other parameters', () => {
    expect(withChannelParam(`${base}?ch=kan11&x=1`, 'dw')).toBe(`${base}?ch=dw&x=1`);
  });

  it('removes the channel for null', () => {
    expect(withChannelParam(`${base}?ch=kan11`, null)).toBe(base);
  });
});
