/** Turns per-link results of the daily check into a report for the owner. */
import {
  channelVerdict,
  describeSourceProblem,
  type ChannelResult,
  type ChannelVerdict,
  type SourceResult,
} from '../shared/linkStatus.ts';

export {
  channelVerdict,
  LIMITATIONS,
  type ChannelResult,
  type SourceResult,
} from '../shared/linkStatus.ts';

/** Whether the report should open (or keep open) the issue. */
export function needsAttention(channels: readonly ChannelResult[]) {
  return channels.some((channel) => {
    const verdict = channelVerdict(channel.sources);
    return verdict === 'down' || verdict === 'problems';
  });
}

function describeSource(source: SourceResult, index: number) {
  const label = index === 0 ? 'קישור ראשי' : `גיבוי ${index}`;
  return `  - ${label}: ${describeSourceProblem(source)}\n    ${source.url}`;
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
  const limited = byVerdict('limited');
  const noLink = byVerdict('no-link');

  const sections: [string, ChannelResult[], boolean][] = [
    ['לא עובדים', down, true],
    ['עונים, אבל אי אפשר לצפות', problems, true],
    ['עובדים, עם קישור שבור', partial, true],
    ['עובדים, עם הגבלות', limited, true],
    ['לא ניתן לבדוק מחוץ לישראל', abroad, false],
    ['בלי קישור (מוצגים לצופים כלא זמינים)', noLink, false],
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
