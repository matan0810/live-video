import { describe, expect, it } from 'vitest';
import { compareVersions, isSavedListCurrent, isVersion } from './listVersion';

describe('compareVersions', () => {
  it('orders versions part by part, as numbers', () => {
    expect(compareVersions('2.7.0', '2.7.0')).toBe(0);
    expect(compareVersions('2.10.0', '2.9.9')).toBeGreaterThan(0);
    expect(compareVersions('2.7.0', '2.7.1')).toBeLessThan(0);
    expect(compareVersions('3.0.0', '2.99.99')).toBeGreaterThan(0);
  });
});

describe('isSavedListCurrent', () => {
  it('lets a release bring its own list, and a later save win again', () => {
    expect(isSavedListCurrent('2.7.0', '2.7.1')).toBe(false);
    expect(isSavedListCurrent('2.7.1', '2.7.1')).toBe(true);
    expect(isSavedListCurrent('2.8.0', '2.7.1')).toBe(true);
    expect(isSavedListCurrent(null, '2.7.1')).toBe(false);
  });
});

describe('isVersion', () => {
  it('accepts plain versions only', () => {
    expect(isVersion('2.7.1')).toBe(true);
    expect(isVersion('2.7')).toBe(false);
    expect(isVersion('2.7.1-beta')).toBe(false);
    expect(isVersion(271)).toBe(false);
  });
});
