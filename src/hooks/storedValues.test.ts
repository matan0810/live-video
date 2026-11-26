import { describe, expect, it } from 'vitest';
import { storedBoolean, storedChoice, storedString, storedStrings } from './storedValues';

describe('stored values', () => {
  it('reads a string, or nothing', () => {
    expect(storedString('dw')).toBe('dw');
    expect(storedString(42)).toBeNull();
    expect(storedString(null)).toBeNull();
  });

  it('reads a list of strings, dropping anything else', () => {
    expect(storedStrings(['a', 3, 'b', null])).toEqual(['a', 'b']);
    expect(storedStrings({ a: 1 })).toBeNull();
  });

  it('reads a setting from a closed list, and a switch', () => {
    expect(storedChoice('light', ['auto', 'light', 'dark'] as const)).toBe('light');
    expect(storedChoice('neon', ['auto', 'light', 'dark'] as const)).toBeNull();
    expect(storedBoolean(true)).toBe(true);
    expect(storedBoolean('true')).toBeNull();
  });
});
