import { describe, expect, it } from 'vitest';
import { channelVerdict, formatReport, needsAttention, type SourceResult } from './linkReport.ts';

const source = (state: SourceResult['state'], extra: Partial<SourceResult> = {}): SourceResult => ({
  url: `https://a.example/${state}.m3u8`,
  state,
  detail: state === 'down' ? 'HTTP 404' : 'OK',
  problems: state === 'problems' ? ['no-audio'] : [],
  ...extra,
});

describe('channelVerdict', () => {
  it('judges a channel by its links', () => {
    expect(channelVerdict([source('ok')])).toBe('ok');
    expect(channelVerdict([source('down'), source('ok')])).toBe('partial');
    expect(channelVerdict([source('ok'), source('problems')])).toBe('partial');
    expect(channelVerdict([source('problems'), source('down')])).toBe('problems');
    expect(channelVerdict([source('down'), source('abroad')])).toBe('down');
    expect(channelVerdict([source('abroad')])).toBe('abroad');
    expect(channelVerdict([source('down'), source('limited', { problems: ['hevc-only'] })])).toBe(
      'limited',
    );
    expect(channelVerdict([])).toBe('no-link');
  });
});

describe('needsAttention', () => {
  it('flags only channels viewers cannot watch', () => {
    const channel = (sources: SourceResult[]) => ({ name: 'A', id: 'a', sources });
    expect(
      needsAttention([channel([source('down'), source('ok')]), channel([source('abroad')])]),
    ).toBe(false);
    expect(needsAttention([channel([source('problems')])])).toBe(true);
    expect(needsAttention([channel([]), channel([source('limited')])])).toBe(false);
    expect(needsAttention([channel([source('down')])])).toBe(true);
  });
});

describe('formatReport', () => {
  it('groups channels and explains each broken link', () => {
    const report = formatReport(
      [
        { name: 'Silent', id: 'silent', sources: [source('problems')] },
        { name: 'Kan', id: 'kan', sources: [source('abroad')] },
        { name: 'Fine', id: 'fine', sources: [source('ok')] },
        { name: 'Waiting', id: 'waiting', sources: [] },
      ],
      'הרשימה שבניהול',
    );
    expect(report).toContain('### עונים, אבל אי אפשר לצפות');
    expect(report).toContain('קישור ראשי: בלי קול');
    expect(report).toContain('### לא ניתן לבדוק מחוץ לישראל');
    expect(report).not.toContain('Fine');
    expect(report).toContain('### בלי קישור (מוצגים לצופים כלא זמינים)');
  });
});
