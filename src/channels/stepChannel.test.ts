import { describe, expect, it } from 'vitest';
import type { Channel } from './index';
import { stepChannel } from './stepChannel';

const channel = (id: string, hasLink = true): Channel => ({
  id,
  name: id,
  short: id,
  sources: hasLink ? [`https://a.example/${id}.m3u8`] : [],
});
const list = [channel('a'), channel('b', false), channel('c'), channel('d')];
const id = (found: Channel | null) => found?.id ?? null;

describe('stepChannel', () => {
  it('skips channels with no link, both ways', () => {
    expect(id(stepChannel(list, 'a', 1))).toBe('c');
    expect(id(stepChannel(list, 'c', -1))).toBe('a');
  });

  it('wraps around the ends', () => {
    expect(id(stepChannel(list, 'd', 1))).toBe('a');
    expect(id(stepChannel(list, 'a', -1))).toBe('d');
  });

  it('leaves a channel with no link when it is the one playing', () => {
    expect(id(stepChannel(list, 'b', 1))).toBe('c');
    expect(id(stepChannel(list, 'b', -1))).toBe('a');
  });

  it('starts from the ends with nothing active, and gives up when nothing can play', () => {
    expect(id(stepChannel(list, null, 1))).toBe('a');
    expect(id(stepChannel(list, null, -1))).toBe('d');
    expect(stepChannel([channel('x', false)], null, 1)).toBeNull();
  });
});
