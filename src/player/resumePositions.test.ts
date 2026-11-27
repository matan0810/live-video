import { describe, expect, it } from 'vitest';
import { parsePositions, rememberPosition, resumePlan } from './resumePositions';
import { DEFAULT_RESUME, parseResumeChoice, RESUME_CHOICES, resumeMaxAgeMs } from './resumeSetting';

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

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
      old: { watchingAt: 1, savedAt: NOW - HOUR * 3 },
      bad: { watchingAt: 'x', savedAt: NOW },
    };
    expect(Object.keys(parsePositions(raw, NOW, 2 * HOUR))).toEqual(['dw']);
    expect(parsePositions('junk', NOW, 2 * HOUR)).toEqual({});
    expect(parsePositions([1, 2], NOW, 2 * HOUR)).toEqual({});
  });

  it('keeps what the chosen age allows, and nothing when remembering is off', () => {
    const raw = { dw: { watchingAt: NOW - 1000, savedAt: NOW - 90 * 60_000 } };
    expect(Object.keys(parsePositions(raw, NOW, HOUR))).toEqual([]);
    expect(Object.keys(parsePositions(raw, NOW, 2 * HOUR))).toEqual(['dw']);
    expect(parsePositions({ dw: { watchingAt: NOW, savedAt: NOW } }, NOW, 0)).toEqual({});
  });
});

describe('the resume setting', () => {
  it('offers off, one hour, two hours and twelve hours, and starts at two hours', () => {
    expect(RESUME_CHOICES).toEqual(['off', '1h', '2h', '12h']);
    expect(DEFAULT_RESUME).toBe('2h');
    expect(RESUME_CHOICES.map(resumeMaxAgeMs)).toEqual([0, HOUR, 2 * HOUR, 12 * HOUR]);
  });

  it('refuses anything else stored', () => {
    expect(parseResumeChoice('2h')).toBe('2h');
    for (const junk of ['3h', 2, null, undefined, {}]) expect(parseResumeChoice(junk)).toBeNull();
  });
});
