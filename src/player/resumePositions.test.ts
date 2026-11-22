import { describe, expect, it } from 'vitest';
import { parsePositions, rememberPosition, resumePlan, RESUME_MAX_AGE_MS } from './resumePositions';

const NOW = 1_800_000_000_000;

describe('rememberPosition', () => {
  it('keeps the broadcast moment, and forgets it at live', () => {
    const saved = rememberPosition({}, 'dw', 600, NOW);
    expect(saved).toEqual({ dw: { watchingAt: NOW - 600_000, savedAt: NOW } });
    expect(rememberPosition(saved, 'dw', 5, NOW)).toEqual({});
  });
});

describe('resumePlan', () => {
  const entry = { watchingAt: NOW - 600_000, savedAt: NOW };

  it('resumes the same moment, now further behind after time away', () => {
    expect(resumePlan(entry, NOW, 1800)).toEqual({ kind: 'seek', seconds: 600 });
    expect(resumePlan(entry, NOW + 300_000, 1800)).toEqual({ kind: 'seek', seconds: 900 });
  });

  it('starts at live when nothing was kept, and says when the moment is outside the window', () => {
    expect(resumePlan(undefined, NOW, 1800)).toEqual({ kind: 'live' });
    expect(resumePlan(entry, NOW + 1_500_000, 1800)).toEqual({ kind: 'outside' });
    expect(resumePlan(entry, NOW, 60)).toEqual({ kind: 'outside' });
  });
});

describe('parsePositions', () => {
  it('keeps recent well-formed entries only', () => {
    const raw = {
      dw: { watchingAt: NOW - 1000, savedAt: NOW - 1000 },
      old: { watchingAt: 1, savedAt: NOW - RESUME_MAX_AGE_MS - 1 },
      bad: { watchingAt: 'x', savedAt: NOW },
    };
    expect(Object.keys(parsePositions(raw, NOW))).toEqual(['dw']);
    expect(parsePositions('junk', NOW)).toEqual({});
    expect(parsePositions([1, 2], NOW)).toEqual({});
  });
});
