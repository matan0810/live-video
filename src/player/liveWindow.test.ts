import { describe, expect, it } from 'vitest';
import { nativeLiveWindow } from './liveWindow';

describe('nativeLiveWindow', () => {
  it('reads the window of a live HLS stream the browser plays itself', () => {
    expect(nativeLiveWindow(Infinity, [[100, 400]], false)).toEqual({ start: 100, end: 400 });
  });

  it('gives a plain audio stream (radio) no window, whatever the browser reports', () => {
    expect(nativeLiveWindow(Infinity, [[0, 300]], true)).toBeNull();
  });

  it('ignores an endless range, as Android Chrome reports for a radio stream', () => {
    expect(nativeLiveWindow(Infinity, [[0, Infinity]], false)).toBeNull();
    expect(nativeLiveWindow(Infinity, [[NaN, 10]], false)).toBeNull();
  });

  it('has no window for a recording or an empty range', () => {
    expect(nativeLiveWindow(600, [[0, 600]], false)).toBeNull();
    expect(nativeLiveWindow(Infinity, [], false)).toBeNull();
  });
});
