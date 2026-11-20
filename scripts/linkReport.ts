/** Turns per-link results of the daily check into a verdict per channel and a report. */
import type { StreamProblem } from '../shared/streamProblems.ts';

export type SourceState = 'ok' | 'problems' | 'down' | 'abroad';

export interface SourceResult {
  url: string;
  state: SourceState;
  /** Why it is down, e.g. "HTTP 404". */
  detail: string;
  problems: StreamProblem[];
}

export type ChannelVerdict = 'ok' | 'partial' | 'problems' | 'down' | 'abroad';

export interface ChannelResult {
  name: string;
  id: string;
  sources: SourceResult[];
}

const PROBLEM_TEXT: Record<StreamProblem, string> = {
  'no-audio': 'בלי קול',
  'low-quality': 'איכות נמוכה מ-360p',
  'hevc-only': 'בפורמט HEVC בלבד, שחלק מהדפדפנים לא מנגנים',
  recording: 'הקלטה ולא שידור חי',
  'blocks-site': 'השרת לא מרשה לנגן אותו מהאתר',
};

/**
 * ok: every link works. partial: viewers get a working link, but the first one or a backup
 * is broken. problems: links answer but none is watchable. down: nothing answers.
 * abroad: the only failures are hosts that refuse anyone outside Israel, so it is unknown.
 */
export function channelVerdict(sources: readonly SourceResult[]): ChannelVerdict {
  if (sources.every((source) => source.state === 'ok')) return 'ok';
  if (sources.some((source) => source.state === 'ok')) return 'partial';
  if (sources.some((source) => source.state === 'problems')) return 'problems';
  if (sources.every((source) => source.state === 'abroad')) return 'abroad';
  return 'down';
}

/** Whether the report should open (or keep open) the issue. */
export function needsAttention(channels: readonly ChannelResult[]) {
  return channels.some((channel) => {
    const verdict = channelVerdict(channel.sources);
    return verdict === 'down' || verdict === 'problems';
  });
}

function describeSource(source: SourceResult, index: number) {
  const label = index === 0 ? 'קישור ראשי' : `גיבוי ${index}`;
  const what =
    source.state === 'problems'
      ? source.problems.map((problem) => PROBLEM_TEXT[problem]).join(', ')
      : source.state === 'abroad'
        ? 'חסום מחוץ לישראל'
        : `לא עונה (${source.detail})`;
  return `  - ${label}: ${what}\n    ${source.url}`;
}

function describe(channel: ChannelResult, onlyBroken: boolean) {
  const lines = channel.sources
    .map((source, index) => ({ source, index }))
    .filter(({ source }) => !onlyBroken || source.state !== 'ok')
    .map(({ source, index }) => describeSource(source, index));
  return [`- **${channel.name}** (\`${channel.id}\`)`, ...lines].join('\n');
}

export function formatReport(channels: readonly ChannelResult[], from: string) {
  const byVerdict = (verdict: ChannelVerdict) =>
    channels.filter((channel) => channelVerdict(channel.sources) === verdict);
  const down = byVerdict('down');
  const problems = byVerdict('problems');
  const partial = byVerdict('partial');
  const abroad = byVerdict('abroad');

  const sections: [string, ChannelResult[], boolean][] = [
    ['לא עובדים', down, true],
    ['עונים, אבל אי אפשר לצפות', problems, true],
    ['עובדים, עם קישור שבור', partial, true],
    ['לא ניתן לבדוק מחוץ לישראל', abroad, false],
  ];
  return [
    `נבדקו ${channels.length} ערוצים מ${from}: ${down.length} לא עובדים, ${problems.length} עם בעיה, ${partial.length} עם קישור שבור.`,
    ...sections
      .filter(([, list]) => list.length > 0)
      .map(([title, list, onlyBroken]) => {
        const items = list.map((channel) => describe(channel, onlyBroken)).join('\n');
        return `\n### ${title}\n\n${items}`;
      }),
    abroad.length > 0
      ? '\nהבדיקה רצה בשרתים מחוץ לישראל; ערוצים שחוסמים חו"ל נבדקים בניהול, מהדפדפן שלך.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
