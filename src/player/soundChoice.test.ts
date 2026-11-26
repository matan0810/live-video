import { describe, expect, it } from 'vitest';
import { applySound, rememberSound } from './soundChoice';

describe('the sound choice', () => {
  it('gives a new player the sound the viewer chose on the last one', () => {
    rememberSound({ muted: true, volume: 0.4 });
    const next = { muted: false, volume: 1 };
    applySound(next);
    expect(next).toEqual({ muted: true, volume: 0.4 });
  });

  it('follows the latest choice', () => {
    rememberSound({ muted: true, volume: 0.4 });
    rememberSound({ muted: false, volume: 0.7 });
    const next = { muted: true, volume: 1 };
    applySound(next);
    expect(next).toEqual({ muted: false, volume: 0.7 });
  });
});
